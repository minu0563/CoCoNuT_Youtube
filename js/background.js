chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
        if (!tabs || tabs.length === 0) return;

        tabs.forEach(tab => {
            switch(command) {
                case "toggle_pip":
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            const video = document.querySelector("video.html5-main-video");
                            if (!video) return;
                            if (document.pictureInPictureElement) {
                                document.exitPictureInPicture();
                            } else {
                                video.requestPictureInPicture();
                            }
                        }
                    });
                    break;

                case "skip_backward":
                case "skip_forward":
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (direction) => {
                            const video = document.querySelector("video.html5-main-video");
                            if (!video) return;

                            if (!document.pictureInPictureElement) return; // PiP 모드가 켜져 있을 때만

                            if (direction === "backward") {
                                video.currentTime -= 10;
                            } else if (direction === "forward") {
                                video.currentTime += 10;
                            }
                        },
                        args: [command === "skip_backward" ? "backward" : "forward"]
                    });
                    break;
            }
        });
    });
});
