(() => {
    if (window.__coconutShortsLoaded) return;
    window.__coconutShortsLoaded = true;

    let enabled = false;
    let lastUrl = location.href;
    let skipCooldown = false;

    const AD_TEXT_PATTERN = /\bads?\b|\bsponsored\b|\badvertisement\b|\badvert\b|광고|annonce|publicité|werbung|patrocinado|anúncio|广告|廣告|広告|реклама|إعلان|اعلان/i;

    chrome.storage.local.get(["shortAuto"], (result) => {
        enabled = result.shortAuto === true;
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.shortAuto) {
            enabled = changes.shortAuto.newValue === true;
            if (!enabled) skipCooldown = false;
        }
    });

    function isShortsPage() {
        return location.pathname.startsWith("/shorts/");
    }

    function isAdvertisement() {
        const activeRenderer = document.querySelector("ytd-reel-video-renderer[is-active]");
        const candidates = [
            ...(activeRenderer?.querySelectorAll(".yt-badge-shape__text, .badge-style-type-ad, [class*='ad-badge']") || []),
            ...document.querySelectorAll(".yt-badge-shape__text, .badge-style-type-ad, ytd-ad-slot-renderer, ytd-promoted-sparkles-web-renderer, [class*='ad-badge']")
        ];

        return candidates.some((element) => {
            const text = (element.innerText || element.textContent || element.getAttribute("aria-label") || "")
                .trim()
                .replace(/\s+/g, " ");
            return text.length > 0 && AD_TEXT_PATTERN.test(text);
        });
    }

    function getNextButton() {
        return document.querySelector(
            "ytd-reel-video-renderer[is-active] #navigation-button-down button, #navigation-button-down button"
        );
    }

    function skipToNext() {
        if (skipCooldown) return false;
        const button = getNextButton();
        if (!button || button.disabled) return false;

        skipCooldown = true;
        button.click();
        // Unlike a permanent latch, cooldown always clears even if YouTube
        // reuses the same video element or URL during an ad transition.
        setTimeout(() => {
            skipCooldown = false;
        }, 1200);
        return true;
    }

    function checkShort() {
        if (!enabled || !isShortsPage()) {
            skipCooldown = false;
            lastUrl = location.href;
            return;
        }

        if (location.href !== lastUrl) {
            lastUrl = location.href;
            skipCooldown = false;
        }

        const video = document.querySelector("ytd-reel-video-renderer[is-active] video, video.html5-main-video, video");
        if (!video) return;

        if (isAdvertisement()) {
            skipToNext();
            return;
        }

        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        const progress = video.currentTime / video.duration;
        if (video.ended || progress >= 0.98) skipToNext();
    }

    document.addEventListener("yt-navigate-finish", () => {
        lastUrl = location.href;
        skipCooldown = false;
    });

    document.addEventListener("ended", (event) => {
        if (event.target?.tagName === "VIDEO") checkShort();
    }, true);

    setInterval(checkShort, 350);
})();
