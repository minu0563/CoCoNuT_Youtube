const qualitySelect = document.getElementById("qualitySelect");
const currentQualityDisplay = document.getElementById("detectedQuality");

function message(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions) || "";
}

function setQualityPlaceholder(text) {
    if (!qualitySelect) return;
    qualitySelect.replaceChildren();
    const option = document.createElement("option");
    option.value = "";
    option.disabled = true;
    option.selected = true;
    option.textContent = text;
    qualitySelect.appendChild(option);
}

function getActiveYouTubeTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs?.[0];
            if (!tab?.id || !tab.url) return resolve(null);

            try {
                const url = new URL(tab.url);
                resolve(url.protocol === "https:" && url.hostname === "www.youtube.com" ? tab : null);
            } catch {
                resolve(null);
            }
        });
    });
}

function sendTabMessage(tabId, payload) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, payload, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(response);
        });
    });
}

async function loadQualities(tab) {
    if (!qualitySelect || !tab) return;

    setQualityPlaceholder(message("loading_available_qualities"));
    try {
        const response = await sendTabMessage(tab.id, { type: "GET_QUALITIES" });
        const qualities = response?.availableQualities || [];

        if (!qualities.length) {
            setQualityPlaceholder(message("no_available_qualities"));
            return;
        }

        qualitySelect.replaceChildren();
        qualities.forEach((quality) => {
            const option = document.createElement("option");
            option.value = quality;
            option.textContent = quality === "Auto" ? message("quality_auto") || "Auto" : quality;
            option.selected = quality === response.preferredQuality;
            qualitySelect.appendChild(option);
        });

        const current = response.currentQuality;
        currentQualityDisplay.textContent = current
            ? message("current_quality_display", [current])
            : message("quality_not_detected");

        if (response.preferredQuality) {
            qualitySelect.value = response.preferredQuality;
        }
    } catch {
        setQualityPlaceholder(message("quality_connection_error"));
        currentQualityDisplay.textContent = message("quality_connection_error");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const shortAuto = document.getElementById("shortAuto");
    const shortStatus = document.getElementById("shortStatus");
    const switchElement = shortAuto?.parentElement;
    const pipButton = document.getElementById("pipBtn");
    const pipStatus = document.getElementById("pipStatus");

    chrome.storage.local.get(["shortAuto"], (result) => {
        const isEnabled = result.shortAuto === true;
        if (shortAuto) shortAuto.checked = isEnabled;
        switchElement?.classList.toggle("active", isEnabled);
        if (shortStatus) shortStatus.textContent = message(isEnabled ? "short_on" : "short_off");
    });

    shortAuto?.addEventListener("change", () => {
        const isEnabled = shortAuto.checked;
        chrome.storage.local.set({ shortAuto: isEnabled });
        switchElement?.classList.toggle("active", isEnabled);
        if (shortStatus) shortStatus.textContent = message(isEnabled ? "short_on" : "short_off");
    });

    const tab = await getActiveYouTubeTab();
    if (!tab) {
        setQualityPlaceholder(message("page_error"));
        if (currentQualityDisplay) currentQualityDisplay.textContent = message("open_youtube_page");
    } else {
        await loadQualities(tab);
        qualitySelect?.addEventListener("focus", () => loadQualities(tab));
        qualitySelect?.addEventListener("change", async () => {
            if (!qualitySelect.value) return;
            try {
                const result = await sendTabMessage(tab.id, {
                    type: "SET_QUALITY",
                    quality: qualitySelect.value
                });
                if (!result?.ok) throw new Error(result?.error || "SET_QUALITY_FAILED");
                window.close();
            } catch {
                currentQualityDisplay.textContent = message("quality_connection_error");
            }
        });
    }

    pipButton?.addEventListener("click", async () => {
        const activeTab = await getActiveYouTubeTab();
        if (!activeTab) {
            if (pipStatus) pipStatus.textContent = message("open_youtube_page");
            return;
        }

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: async () => {
                    const video = document.querySelector("video.html5-main-video");
                    if (!video) return "NO_VIDEO";

                    try {
                        if (document.pictureInPictureElement) {
                            await document.exitPictureInPicture();
                            return "EXITED";
                        }
                        if (!document.pictureInPictureEnabled || video.readyState < 1) return "UNAVAILABLE";
                        await video.requestPictureInPicture();
                        return "STARTED";
                    } catch {
                        return "FAILED";
                    }
                }
            });

            const status = results?.[0]?.result;
            const statusKey = status === "STARTED" ? "pip_started"
                : status === "EXITED" ? "pip_exited"
                : status === "NO_VIDEO" ? "pip_no_video"
                : "pip_failed";
            if (pipStatus) pipStatus.textContent = message(statusKey);
        } catch {
            if (pipStatus) pipStatus.textContent = message("pip_failed");
        }
    });
});