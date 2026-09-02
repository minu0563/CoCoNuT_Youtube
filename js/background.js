chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://coconut-official-website.vercel.app/' });
  } else if (details.reason === 'update') {
    chrome.tabs.create({ url: 'https://coconut-official-website.vercel.app/newspage?tag=all' });
  }
});

async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({ url: "*://www.youtube.com/*" });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    } catch (e) {}
  }
}

chrome.runtime.onInstalled.addListener(injectIntoOpenTabs);
// 브라우저 재시작 시
chrome.runtime.onStartup.addListener(injectIntoOpenTabs);
injectIntoOpenTabs();

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
