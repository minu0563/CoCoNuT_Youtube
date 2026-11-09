chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "https://coconut-official-website.vercel.app/" });
    } else if (details.reason === "update") {
        chrome.tabs.create({ url: "https://coconut-official-website.vercel.app/newspage?tag=all" });
    }
});

chrome.commands.onCommand.addListener(async (command) => {
    try {
        if (command === "toggle_pip") {
            // The shortcut is global: find the most recently used YouTube tab,
            // even when another tab or application currently has focus.
            const tabs = await chrome.tabs.query({ url: ["https://www.youtube.com/*"] });
            const youtubeTabs = tabs
                .filter((tab) => Number.isInteger(tab.id))
                .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
            const targetTab = youtubeTabs[0];
            if (!targetTab) return;

            await chrome.scripting.executeScript({
                target: { tabId: targetTab.id },
                func: async () => {
                    const video = document.querySelector("video.html5-main-video");
                    if (!video) return;

                    try {
                        if (document.pictureInPictureElement) {
                            await document.exitPictureInPicture();
                        } else if (document.pictureInPictureEnabled && video.readyState >= 1) {
                            await video.requestPictureInPicture();
                        }
                    } catch (error) {
                        console.warn("CoCoNuT: PiP command failed", error);
                    }
                }
            });
            return;
        }

        if (command === "skip_backward" || command === "skip_forward") {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id || !tab.url?.startsWith("https://www.youtube.com/")) return;

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (direction) => {
                    const video = document.querySelector("video.html5-main-video");
                    if (!video || !document.pictureInPictureElement) return;

                    const delta = direction === "backward" ? -10 : 10;
                    const nextTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + delta));
                    video.currentTime = nextTime;
                },
                args: [command === "skip_backward" ? "backward" : "forward"]
            });
        }
    } catch (error) {
        console.warn("CoCoNuT: shortcut execution failed", error);
    }
});
