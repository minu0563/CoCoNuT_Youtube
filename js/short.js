(() => {
    if (window.__coconutShortsLoaded) return;
    window.__coconutShortsLoaded = true;

    let enabled = false;
    let currentVideo = null;
    let skipRequested = false;
    let lastUrl = location.href;

    const AD_LABELS = [
        "sponsored", "advertisement", "advert", "광고", "annonce",
        "publicité", "werbung", "patrocinado", "anúncio", "广告",
        "廣告", "広告", "реклама", "إعلان", "اعلان"
    ];

    chrome.storage.local.get(["shortAuto"], (result) => {
        enabled = result.shortAuto === true;
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.shortAuto) {
            enabled = changes.shortAuto.newValue === true;
            if (!enabled) skipRequested = false;
        }
    });

    function isShortsPage() {
        return location.pathname.startsWith("/shorts/");
    }

    function isAdvertisement() {
        const badges = document.querySelectorAll(
            ".yt-badge-shape__text, .badge-style-type-ad, [aria-label]"
        );

        return [...badges].some((element) => {
            const text = (
                element.innerText ||
                element.getAttribute("aria-label") ||
                ""
            ).trim().toLowerCase().replace(/\s+/g, " ");

            if (!text) return false;
            if (AD_LABELS.some((label) => text === label || text.startsWith(label + " "))) {
                return true;
            }
            return /\bads?\b|\bsponsored\b|\badvertisement\b/i.test(text);
        });
    }

    function getNextButton() {
        return document.querySelector(
            "#navigation-button-down button, ytd-reel-video-renderer[is-active] #navigation-button-down button"
        );
    }

    function skipToNext() {
        if (skipRequested) return false;
        const button = getNextButton();
        if (!button || button.disabled) return false;

        skipRequested = true;
        button.click();
        return true;
    }

    function checkShort() {
        if (!enabled || !isShortsPage()) {
            currentVideo = null;
            skipRequested = false;
            return;
        }

        const video = document.querySelector("video.html5-main-video, ytd-reel-video-renderer video");
        if (!video) return;

        if (video !== currentVideo || location.href !== lastUrl) {
            currentVideo = video;
            lastUrl = location.href;
            skipRequested = false;
        }

        if (isAdvertisement()) {
            skipToNext();
            return;
        }

        if (!Number.isFinite(video.duration) || video.duration <= 0) return;

        const progress = video.currentTime / video.duration;
        if (video.ended || progress >= 0.985) skipToNext();
    }

    document.addEventListener("yt-navigate-finish", () => {
        currentVideo = null;
        skipRequested = false;
        lastUrl = location.href;
    });

    document.addEventListener("ended", (event) => {
        if (event.target?.tagName === "VIDEO") checkShort();
    }, true);

    setInterval(checkShort, 500);
})();