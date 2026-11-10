const qualitySelect = document.getElementById('qualitySelect');
const currentQualityDisplay = document.getElementById('detectedQuality');

function isYouTubeUrl(url) {
    try {
        return new URL(url).hostname === 'www.youtube.com';
    } catch (e) {
        return false;
    }
}

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

        if (!isYouTubeUrl(tab?.url)) {
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
        qualitySelect.replaceChildren(makeOption(
            q || "",
            q || chrome.i18n.getMessage("detection_failed"),
            { selected: true, disabled: !q }
        ));
    }).catch(() => {
        currentQualityDisplay.textContent = chrome.i18n.getMessage("quality_not_detected");
    });
}

function makeOption(value, text, { selected = false, disabled = false } = {}) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    opt.selected = selected;
    opt.disabled = disabled;
    return opt;
}

// 화질 목록은 content.js가 유튜브 설정 메뉴를 열어서 읽어온다.
function loadAvailableQualities(tabId) {
    if (qualitySelect.dataset.loaded === 'true') return;

    const currentQ = qualitySelect.dataset.currentQuality || "";

    qualitySelect.replaceChildren(makeOption("", chrome.i18n.getMessage("loading_available_qualities"), { selected: true, disabled: true }));

    Promise.all([
        chrome.tabs.sendMessage(tabId, { type: 'GET_QUALITIES' }, { frameId: 0 }),
        chrome.storage.local.get('preferredQuality')
    ]).then(([res, { preferredQuality }]) => {
        const list = res?.availableQualities || [];

        if (!list.length) {
            qualitySelect.replaceChildren(makeOption("", chrome.i18n.getMessage("no_available_qualities"), { selected: true, disabled: true }));
            return;
        }

        qualitySelect.dataset.loaded = 'true';
        qualitySelect.replaceChildren();

        const seen = new Set();
        list.forEach(q => {
            const isAutoItem = /auto|자동/i.test(q);
            const value = isAutoItem ? 'Auto' : (q.match(/\d{3,4}p/) || [q])[0];
            if (seen.has(value)) return; // "1080p"와 "1080p Premium" 중복 제거
            seen.add(value);
            qualitySelect.appendChild(makeOption(value, q));
        });

        // 저장된 선호 화질이 있으면 그것을, 없으면 현재 재생 화질을 선택해서 보여준다.
        const initial = [preferredQuality, currentQ].find(v => v && seen.has(v));
        if (initial) qualitySelect.value = initial;
    }).catch(() => {
        qualitySelect.replaceChildren(makeOption("", chrome.i18n.getMessage("detection_error"), { selected: true, disabled: true }));
    });
}

// 선택한 화질을 선호 화질로 저장(이후 영상에서도 자동 적용)하고 현재 영상에도 바로 적용한다.
function setQuality(tabId, preferredQuality) {
    chrome.storage.local.set({ preferredQuality })
        .then(() => chrome.tabs.sendMessage(tabId, { type: 'SET_QUALITY', quality: preferredQuality }, { frameId: 0 }))
        .catch(() => {})
        .finally(() => window.close());
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
            if (!tab) return;
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
            }).catch(() => {
                if (pipStatus) pipStatus.textContent = chrome.i18n.getMessage("pipmagase2");
            });
        });
    });
});
