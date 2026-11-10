const YT_URL_PATTERN = "*://www.youtube.com/*";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://coconut-official-website.vercel.app/' });
  } else if (details.reason === 'update') {
    chrome.tabs.create({ url: 'https://coconut-official-website.vercel.app/newspage?tag=all' });
  }
});

// 설치/업데이트 시점에 이미 열려 있던 유튜브 탭에는 content_scripts가 자동 주입되지 않으므로 직접 주입한다.
// (브라우저 재시작이나 새로 여는 탭은 manifest의 content_scripts가 알아서 처리한다.)
// 파일 경로는 확장 프로그램 루트 기준이다. content.js / short.js 둘 다 중복 실행 방지 가드가 있다.
async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({ url: YT_URL_PATTERN });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["js/content.js", "js/short.js"]
      });
    } catch (e) {
      console.warn("[CoCoNuT] inject failed:", tab.id, e);
    }
  }
}

chrome.runtime.onInstalled.addListener(injectIntoOpenTabs);

// ---------- 단축키 ----------
// 주의: requestPictureInPicture()는 사용자 제스처가 필요하다. 확장 프로그램 단축키의 제스처는
// "단축키 이벤트 → 콜백 → executeScript" 로 바로 이어질 때만 페이지까지 전달되므로,
// 그 사이에 다른 비동기 작업(탭 상태 조회 등)을 끼워 넣으면 PiP 실행이 막힌다.
// 그래서 단축키 핸들러는 tabs.query 콜백 안에서 곧바로 executeScript 를 호출한다.
function togglePip() {
  const video = document.querySelector("video.html5-main-video");
  if (!video) return;
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture();
  } else {
    video.requestPictureInPicture().catch(() => {});
  }
}

function skipVideo(seconds) {
  const video = document.querySelector("video.html5-main-video");
  if (!video || !document.pictureInPictureElement) return; // PiP 모드가 켜져 있을 때만
  const max = Number.isFinite(video.duration) ? video.duration : Infinity;
  video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), max);
}

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ url: YT_URL_PATTERN }, (tabs) => {
    if (!tabs || tabs.length === 0) return;

    tabs.forEach((tab) => {
      const run = (func, args) =>
        chrome.scripting.executeScript({ target: { tabId: tab.id }, func, args })
          .catch((e) => console.warn("[CoCoNuT] command failed:", command, tab.id, e));

      if (command === "toggle_pip") {
        run(togglePip);
      } else if (command === "skip_backward") {
        run(skipVideo, [-10]);
      } else if (command === "skip_forward") {
        run(skipVideo, [10]);
      }
    });
  });
});
