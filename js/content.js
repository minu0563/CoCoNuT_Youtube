(() => {
    if (window.__coconutContentLoaded) return;
    window.__coconutContentLoaded = true;

    const QUALITY_LABELS = {
        tiny: "144p",
        small: "240p",
        medium: "360p",
        large: "480p",
        hd720: "720p",
        hd1080: "1080p",
        hd1440: "1440p",
        hd2160: "2160p",
        hd2880: "2880p",
        highres: "4320p"
    };

    const QUALITY_LEVELS = Object.fromEntries(
        Object.entries(QUALITY_LABELS).map(([level, label]) => [label, level])
    );

    let preferredQuality = null;
    let applyTimer = null;
    let lastAppliedVideo = null;

    function getPlayer() {
        return document.getElementById("movie_player");
    }

    function getPlayerResponse() {
        let response = window.ytInitialPlayerResponse ||
            window.ytplayer?.config?.args?.player_response;

        if (typeof response === "string") {
            try {
                response = JSON.parse(response);
            } catch {
                return null;
            }
        }

        return response;
    }

    function getAvailableQualities() {
        const response = getPlayerResponse();
        const formats = [
            ...(response?.streamingData?.formats || []),
            ...(response?.streamingData?.adaptiveFormats || [])
        ];

        const labels = new Set(
            formats.map((format) => format.qualityLabel).filter(Boolean)
        );

        try {
            const levels = getPlayer()?.getAvailableQualityLevels?.() || [];
            levels.forEach((level) => {
                if (QUALITY_LABELS[level]) labels.add(QUALITY_LABELS[level]);
            });
        } catch {
            // The player API may not be ready yet.
        }

        const sorted = [...labels].sort((a, b) => {
            const heightA = Number.parseInt(a, 10) || 0;
            const heightB = Number.parseInt(b, 10) || 0;
            return heightB - heightA;
        });

        return ["Auto", ...sorted];
    }

    function getCurrentQuality() {
        const player = getPlayer();

        try {
            const level = player?.getPlaybackQuality?.();
            if (level && QUALITY_LABELS[level]) return QUALITY_LABELS[level];
        } catch {
            // Fall back to the rendered video dimensions.
        }

        const video = document.querySelector("video.html5-main-video");
        if (video?.videoHeight) return video.videoHeight + "p";
        return null;
    }

    function normalizeQuality(value) {
        if (!value || value.toLowerCase() === "auto" || value === "자동") return "Auto";
        const match = value.match(/(\d{3,4})\s*p/i);
        return match ? match[1] + "p" : null;
    }

    function applyQualityWithPlayerApi(quality) {
        const player = getPlayer();
        if (!player) return false;

        try {
            if (quality === "Auto") {
                player.setPlaybackQualityRange?.("auto", "auto");
                player.setPlaybackQuality?.("auto");
                return true;
            }

            const level = QUALITY_LEVELS[quality];
            const availableLevels = player.getAvailableQualityLevels?.() || [];
            const targetLevel = level && availableLevels.includes(level) ? level : null;

            if (targetLevel) {
                player.setPlaybackQualityRange?.(targetLevel, targetLevel);
                player.setPlaybackQuality?.(targetLevel);
                return true;
            }
        } catch (error) {
            console.debug("CoCoNuT: player API quality selection unavailable", error);
        }

        return false;
    }

    function findMenuItem(items, terms) {
        return [...items].find((item) => {
            const label = (item.textContent || "").trim().toLowerCase();
            return terms.some((term) => label.includes(term));
        });
    }

    async function applyQualityWithMenu(quality) {
        const settingsButton = document.querySelector(".ytp-settings-button");
        if (!settingsButton) return false;

        const wasMenuOpen = document.querySelector(".ytp-settings-menu");
        if (wasMenuOpen) return false;

        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        settingsButton.click();
        await wait(150);

        const qualityMenu = findMenuItem(
            document.querySelectorAll(".ytp-menuitem"),
            ["quality", "화질", "画質", "画质", "qualité", "qualität", "kwaliteit", "kalidad", "kualitas", "qualidade"]
        );

        if (!qualityMenu) {
            settingsButton.click();
            return false;
        }

        qualityMenu.click();
        await wait(150);

        const target = [...document.querySelectorAll(".ytp-menuitem")].find((item) => {
            const text = (item.textContent || "").replace(/\s+/g, " ").trim();
            if (quality === "Auto") {
                return /\bauto\b|자동|自動|自動/i.test(text);
            }
            return text.includes(quality);
        });

        if (target) target.click();
        else settingsButton.click();

        return Boolean(target);
    }

    async function applyPreferredQuality() {
        if (!preferredQuality) return;
        const video = document.querySelector("video.html5-main-video");
        if (!video || video.readyState < 1) return;

        if (preferredQuality === "Auto") {
            applyQualityWithPlayerApi("Auto");
            lastAppliedVideo = video;
            return;
        }

        if (applyQualityWithPlayerApi(preferredQuality)) {
            lastAppliedVideo = video;
            return;
        }

        await applyQualityWithMenu(preferredQuality);
        lastAppliedVideo = video;
    }

    function scheduleQualityApply(delay = 700) {
        if (!preferredQuality) return;
        clearTimeout(applyTimer);
        applyTimer = setTimeout(() => {
            applyPreferredQuality().catch((error) => {
                console.warn("CoCoNuT: failed to apply preferred quality", error);
            });
        }, delay);
    }

    chrome.storage.local.get(["preferredQuality"], (result) => {
        preferredQuality = normalizeQuality(result.preferredQuality);
        if (preferredQuality) scheduleQualityApply(1200);
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local" || !changes.preferredQuality) return;
        preferredQuality = normalizeQuality(changes.preferredQuality.newValue);
        lastAppliedVideo = null;
        scheduleQualityApply(300);
    });

    document.addEventListener("yt-navigate-finish", () => {
        lastAppliedVideo = null;
        scheduleQualityApply(1200);
    });

    document.addEventListener("yt-page-data-updated", () => {
        lastAppliedVideo = null;
        scheduleQualityApply(1000);
    });

    document.addEventListener("loadedmetadata", (event) => {
        if (event.target?.tagName === "VIDEO") scheduleQualityApply(500);
    }, true);

    // Detect player replacement without observing the entire YouTube DOM.
    setInterval(() => {
        const video = document.querySelector("video.html5-main-video");
        if (video && video !== lastAppliedVideo) scheduleQualityApply(500);
    }, 1000);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type === "GET_QUALITIES") {
            sendResponse({
                availableQualities: getAvailableQualities(),
                currentQuality: getCurrentQuality(),
                preferredQuality
            });
            return;
        }

        if (message?.type === "SET_QUALITY") {
            const quality = normalizeQuality(message.quality);
            if (!quality) {
                sendResponse({ ok: false, error: "INVALID_QUALITY" });
                return;
            }

            chrome.storage.local.set({ preferredQuality: quality }, () => {
                if (chrome.runtime.lastError) {
                    sendResponse({ ok: false, error: chrome.runtime.lastError.message });
                    return;
                }

                preferredQuality = quality;
                lastAppliedVideo = null;
                scheduleQualityApply(100);
                sendResponse({ ok: true, preferredQuality: quality });
            });
            return true;
        }
    });
})();