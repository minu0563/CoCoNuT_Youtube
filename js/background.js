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
// 단축키는 유튜브 밖(다른 창)에서도 눌릴 수 있으므로 열려있는 모든 유튜브 탭 중에서 "대상 탭"을 하나 고른다.
// PiP 창은 브라우저 전체에서 하나만 열 수 있어서, 모든 탭에 동시에 실행하면 어떤 탭이 이길지 알 수 없다.
//   1순위: 이미 PiP가 켜져 있는 탭 (끄기 / 10초 이동)
//   2순위: 재생 중인 영상이 있는 탭
//   3순위: 영상이 있는 탭 중 가장 최근에 사용한 탭
function probeVideo() {
  const v = document.querySelector("video.html5-main-video");
  return {
    hasVideo: !!v,
    playing: !!v && !v.paused && !v.ended && v.readyState > 2,
    pip: !!document.pictureInPictureElement
  };
}

async function pickTargetTab() {
  const tabs = await chrome.tabs.query({ url: YT_URL_PATTERN });
  const probes = await Promise.all(tabs.map(async (tab) => {
    try {
      const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: probeVideo });
      return { tab, ...(res?.result || {}) };
    } catch (e) {
      return { tab };
    }
  }));

  const recent = (a, b) => (b.tab.lastAccessed || 0) - (a.tab.lastAccessed || 0);
  const pip = probes.filter(p => p.pip).sort(recent)[0];
  if (pip) return { tab: pip.tab, pip: true };

  const playing = probes.filter(p => p.playing).sort(recent);
  const withVideo = probes.filter(p => p.hasVideo).sort(recent);
  const target = playing[0] || withVideo[0];
  return target ? { tab: target.tab, pip: false } : null;
}

function togglePip() {
  const video = document.querySelector("video.html5-main-video");
  if (!video) return;
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture();
  } else {
    video.requestPictureInPicture();
  }
}

function skipVideo(seconds) {
  const video = document.querySelector("video.html5-main-video");
  if (!video || !document.pictureInPictureElement) return; // PiP 모드가 켜져 있을 때만
  const max = Number.isFinite(video.duration) ? video.duration : Infinity;
  video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), max);
}

chrome.commands.onCommand.addListener(async (command) => {
  try {
    const target = await pickTargetTab();
    if (!target) return;
    const tabId = target.tab.id;

    if (command === "toggle_pip") {
      await chrome.scripting.executeScript({ target: { tabId }, func: togglePip });
    } else if (command === "skip_backward" || command === "skip_forward") {
      if (!target.pip) return; // PiP가 켜진 탭이 없으면 아무것도 하지 않음
      await chrome.scripting.executeScript({
        target: { tabId },
        func: skipVideo,
        args: [command === "skip_backward" ? -10 : 10]
      });
    }
  } catch (e) {
    console.warn("[CoCoNuT] command failed:", command, e);
  }
});
