const qualitySelect = document.getElementById('qualitySelect');
const currentQualityDisplay = document.getElementById('detectedQuality');

document.addEventListener('DOMContentLoaded', () => {
    const shortAuto = document.getElementById("shortAuto");
    const switchEl = shortAuto?.parentElement;
    const sh = document.getElementById("shortStatus");

    chrome.storage.local.get(["shortAuto"], ({ shortAuto: saved }) => {
        const state = saved === true;
        if (shortAuto) shortAuto.checked = state;
        switchEl?.classList.toggle("active", state);
        if (sh) sh.innerHTML = state ? chrome.i18n.getMessage("short_on") : chrome.i18n.getMessage("short_off");
    });

    shortAuto?.addEventListener("change", () => {
        const checked = shortAuto.checked;
        chrome.storage.local.set({ shortAuto: checked });
        switchEl?.classList.toggle("active", checked);
        if (sh) sh.innerHTML = checked ? chrome.i18n.getMessage("short_on") : chrome.i18n.getMessage("short_off");
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];

        if (!tab?.url?.includes('youtube.com')) {
            currentQualityDisplay.textContent = chrome.i18n.getMessage("open_youtube_page");
            qualitySelect.innerHTML = `<option value="" disabled selected>${chrome.i18n.getMessage("page_error")}</option>`;
            return;
        }

        updateCurrentQuality(tab.id);

        qualitySelect?.addEventListener('mousedown', () => {
            loadAvailableQualities(tab.id);
        }, { once: true });

        qualitySelect?.addEventListener('change', (e) => {
            setQuality(tab.id, e.target.value);
        });
    });
});


// ===== 화질 관련 필수 함수만 유지 =====

function getCurrentPlaybackQuality() {
    const v = document.querySelector('video.html5-main-video');
    if (v?.videoHeight) return `${v.videoHeight}p`;

    const q = document.querySelector('.ytp-menuitem[aria-checked="true"] .ytp-menuitem-label');
    const match = q?.textContent.replace(/\u00A0/g, '').match(/(\d+p)/);
    return match ? match[1] : null;
}

function detectAvailableQualities() {
    const wait = ms => new Promise(r => setTimeout(r, ms));

    return (async () => {
        const settingsBtn = document.querySelector('.ytp-settings-button');
        if (!settingsBtn) return [];

        settingsBtn.click();
        await wait(100);

        const menuItems = [...document.querySelectorAll('.ytp-menuitem-label')];
        const qualityMenu = menuItems.find(m =>
            ["화질","quality","画質","画质","qualité","qualität","kwaliteit","kalidad","kualitas","qualidade","جودة","качество"]
            .some(k => m.textContent.toLowerCase().includes(k))
        )?.parentElement;

        if (!qualityMenu) {
            settingsBtn.click();
            return [];
        }

        qualityMenu.click();
        await wait(100);

        const items = [...document.querySelectorAll('.ytp-menuitem-label')]
            .map(o => o.textContent.trim())
            .filter(t => /p/i.test(t) || /auto|자동/i.test(t));

        settingsBtn.click();
        return items;
    })();
}

function updateCurrentQuality(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: getCurrentPlaybackQuality
    }).then(res => {
        const q = res?.[0]?.result;

        qualitySelect.dataset.currentQuality = q || "";

        currentQualityDisplay.textContent = q
            ? chrome.i18n.getMessage("current_quality_display", [q])
            : chrome.i18n.getMessage("quality_not_detected");

        qualitySelect.dataset.loaded = q ? 'false' : 'true';
        qualitySelect.innerHTML = q
            ? `<option value="${q}" selected>${q}</option>`
            : `<option value="" disabled selected>${chrome.i18n.getMessage("detection_failed")}</option>`;
    });
}


function loadAvailableQualities(tabId) {
    if (qualitySelect.dataset.loaded === 'true') return;

    const currentQ = qualitySelect.dataset.currentQuality || "";

    qualitySelect.innerHTML = `<option disabled selected>${chrome.i18n.getMessage("loading_available_qualities")}</option>`;

    chrome.scripting.executeScript({
        target: { tabId },
        func: detectAvailableQualities
    }).then(res => {
        const list = res?.[0]?.result || [];

        if (!list.length) {
            qualitySelect.innerHTML = `<option disabled selected>${chrome.i18n.getMessage("no_available_qualities")}</option>`;
            return;
        }

        qualitySelect.dataset.loaded = 'true';
        qualitySelect.innerHTML = '';

        list.forEach(q => {
            const opt = document.createElement('option');
            opt.value = /auto|자동/i.test(q) ? 'Auto' : q;
            opt.textContent = q;

            if (q === currentQ) opt.selected = true;

            qualitySelect.appendChild(opt);
        });

    });
}

// 언어별 화질 설정 감지 및 적용
function setQuality(tabId, preferredQuality) {
    function apply(quality) {
        const wait = ms => new Promise(r => setTimeout(r, ms));

        (async () => {
            const settingsBtn = document.querySelector('.ytp-settings-button');
            if (!settingsBtn) return;

            settingsBtn.click();
            await wait(100);

            const qMenu = [...document.querySelectorAll('.ytp-menuitem')].find(i =>
                ["화질","quality","画質","画质","qualité","qualität","kwaliteit","kalidad","kualitas","qualidade","جودة","качество"]
                .some(k => i.textContent.toLowerCase().includes(k))
            );

            if (!qMenu) return;

            qMenu.click();
            await wait(100);

            const target = [...document.querySelectorAll('.ytp-menuitem-label')]
                .find(l => l.textContent.includes(quality));

            target?.click();
            settingsBtn.click();
        })();
    }

    chrome.scripting.executeScript({
        target: { tabId },
        func: apply,
        args: [preferredQuality]
    }).finally(() => window.close());
}

// pip 모드
document.addEventListener("DOMContentLoaded", () => {
    const pipBtn = document.getElementById("pipBtn");
    const pipStatus = document.getElementById("pipStatus");

    if (!pipBtn) return;

    pipBtn.textContent = chrome.i18n.getMessage("pipBtn") || "PIP 실행";

    pipBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const video = document.querySelector("video.html5-main-video");
                    if (video) {
                        if (document.pictureInPictureElement) {
                            document.exitPictureInPicture();
                        } else {
                            video.requestPictureInPicture();
                        }
                        return true;
                    }
                    return false;
                }
            }).then((res) => {
                const ok = res?.[0]?.result;
                if (pipStatus)
                    pipStatus.textContent = ok
                        ? chrome.i18n.getMessage("pipmasage")
                        : chrome.i18n.getMessage("pipmagase2");
            });
        });
    });
});
