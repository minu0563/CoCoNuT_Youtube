chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "https://coconut-official-website.vercel.app/" });
    } else if (details.reason === "update") {
        chrome.tabs.create({ url: "https://coconut-official-website.vercel.app/newspage?tag=all" });
    }
});

chrome.commands.onCommand.addListener(async (command) => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab.url) return;

        const url = new URL(tab.url);
        if (url.protocol !== "https:" || url.hostname !== "www.youtube.com") return;

        if (command === "toggle_pip") {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
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