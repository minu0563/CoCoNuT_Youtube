// ======================
// 0. 쇼츠 링크 진입 시 새로고침 (한 번만)
// ======================
(function () {
  function maybeReloadOnShorts() {
    const isShorts = location.pathname.startsWith('/shorts/');
    const hasRefreshed = sessionStorage.getItem("shortsRefreshed");

    if (isShorts && !hasRefreshed) {
      sessionStorage.setItem("shortsRefreshed", "true");
      setTimeout(() => location.reload(), 300);
    }

    if (!isShorts && hasRefreshed) {
      sessionStorage.removeItem("shortsRefreshed");
    }
  }

  window.addEventListener('yt-navigate-finish', maybeReloadOnShorts);
  maybeReloadOnShorts();
})();

// ======================
// 1. 전역 변수 및 초기 설정
// ======================
let lang = 'en';
let autoSkipEnabled = false;
let video = null;
let skipIntervalId = null;
let listenersAttached = false;
let observer = null;
let lastSkipTime = 0;

// ======================
function updateButtonLabel() {
  const btn = document.getElementById('short-autoskip');
  if (btn && typeof translations !== 'undefined' && translations[lang]) {
    btn.textContent = `${translations[lang]['Short Auto Skip']}: ${autoSkipEnabled ? 'ON' : 'OFF'}`;
  }
}

// ======================
// 2. 언어 설정 & 버튼 업데이트
// ======================
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get("selectedLanguage", data => {
    lang = data.selectedLanguage || 'en';
    updateButtonLabel();
  });
});

// ======================
// 3. 이벤트 리스너 관리
// ======================
function onTimeUpdate() {
  if (!autoSkipEnabled || !video || isNaN(video.duration) || video.duration === 0) return;

  const pct = video.currentTime / video.duration;
  if (pct >= 0.98) {
    video.removeEventListener('timeupdate', onTimeUpdate);
    listenersAttached = false;
    skipNextShorts();
  }
}

function onEnded() {
  if (!autoSkipEnabled) return;
  listenersAttached = false;
  skipNextShorts();
}

function attachListeners() {
  if (!video || listenersAttached) return;

  video.removeEventListener('ended', onEnded);
  video.removeEventListener('timeupdate', onTimeUpdate);

  video.addEventListener('ended', onEnded);
  video.addEventListener('timeupdate', onTimeUpdate);
  listenersAttached = true;
}

// ======================
// 4. IntersectionObserver 기반 비디오 감지
// ======================
function initObserver() {
  if (observer) observer.disconnect();

  let hasInitialized = false;

  observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting && e.target.tagName === 'VIDEO') {
        if (!hasInitialized) {
          hasInitialized = true;

          setTimeout(() => {
            if (ad("nofollow")) {
              skipNextShorts();
            } else {
              video = e.target;
              listenersAttached = false;
              attachListeners();
            }
          }, 500);
        } else {
          if (ad("nofollow")) {
            skipNextShorts();
            return;
          }
          video = e.target;
          listenersAttached = false;
          attachListeners();
        }
      }
    }
  }, { root: null, threshold: 0.75 });

  document.querySelectorAll('ytd-reel-video-renderer video')
    .forEach(v => observer.observe(v));
}

document.addEventListener('yt-navigate-finish', initObserver);
initObserver();

// ======================
// 5. 다음 쇼츠로 이동: 버튼 클릭 방식
// ======================
function skipNextShorts() {
  const now = Date.now();
  if (now - lastSkipTime < 3000) return;
  lastSkipTime = now;

  const nextBtn = document.querySelector('button.ytp-next-button') ||
                  document.querySelector('button[aria-label="다음 동영상"]');
  if (nextBtn) nextBtn.click();
}

// ======================
// 6. 백업 감지 루프
// ======================
function findVisibleVideo() {
  const vList = Array.from(document.getElementsByTagName('video'));
  const vis = vList.find(vid => {
    const r = vid.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  if (vis) {
    video = vis;
    listenersAttached = false;
    attachListeners();
  }
}

// ======================
// 7. 광고 감지 함수
// ======================
function ad(value) {
  const matches = document.querySelectorAll(`a[rel="${value}"]`);
  return matches.length > 0;
}

// ======================
// 8. 스킵 루프
// ======================
function startSkippingLoop() {
  if (skipIntervalId != null) return;

  skipIntervalId = setInterval(() => {
    if (!autoSkipEnabled) return;

    if (ad("nofollow")) {
      skipNextShorts();
      return;
    }

    if (!listenersAttached) {
      findVisibleVideo();
    }
  }, 1000);
}

function stopSkippingLoop() {
  if (skipIntervalId != null) {
    clearInterval(skipIntervalId);
    skipIntervalId = null;
  }
}

// ======================
// 9. 메시지 리스너
// ======================
chrome.storage.sync.get('shortAutoSkipEnabled', data => {
  autoSkipEnabled = data.shortAutoSkipEnabled ?? false;
  if (autoSkipEnabled) startSkippingLoop();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.autoSkipEnabled !== undefined) {
    autoSkipEnabled = msg.autoSkipEnabled;
    if (autoSkipEnabled) startSkippingLoop();
    else stopSkippingLoop();
  }
});
