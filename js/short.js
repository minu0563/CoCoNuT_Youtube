let isAutoSkipOn = false;
let skipCooldown = false;
let lastUrl = location.href;

chrome.storage.local.get(['shortAuto'], (result) => {
  isAutoSkipOn = result.shortAuto === true;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.shortAuto) {
    isAutoSkipOn = changes.shortAuto.newValue;
  }
});

function isAdBadge() {
  const badge = document.querySelector(".yt-badge-shape__text");
  if (!badge) return false;

  let text = badge.innerText.trim().toLowerCase().replace(/\s+/g, "");
  const adWords = [
    "ad","ads","sponsored","sponsor","광고","advertisement",
    "annonce","publicité","werbung","iklan","patrocinado",
    "anúncio","广告","廣告","広告","реклама","إعلان","اعلان"
  ];
  return adWords.some(word => text.includes(word));
}

function doSkip(nextBtn) {
  if (skipCooldown) return;
  skipCooldown = true;
  nextBtn.click();
  setTimeout(() => { skipCooldown = false; }, 1000);
}

function trySkipShort() {
  if (!isAutoSkipOn) return;
  if (!location.href.includes("/shorts/")) return;

  const video = document.querySelector("video");
  if (!video || !video.duration || video.duration < 1) return;

  const progress = (video.currentTime / video.duration) * 100;
  const nextBtn = document.querySelector('#navigation-button-down > ytd-button-renderer > yt-button-shape > button');
  if (!nextBtn) return;

  if (isAdBadge() || progress >= 98) {
    doSkip(nextBtn);
  }
}

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    skipCooldown = false;
  }
}, 200);

setInterval(trySkipShort, 350);
