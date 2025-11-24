let isAutoSkipOn = false;

chrome.storage.local.get(['shortAuto'], (result) => {
  isAutoSkipOn = result.shortAuto === true;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.shortAuto) {
    isAutoSkipOn = changes.shortAuto.newValue;
  }
});

function autoSkipShorts() {
  const ad = document.querySelector(".masthead-ad");

  if (!isAutoSkipOn) return;
  if (!window.location.href.includes('/shorts/')) return;
  const video = document.querySelector('video');
  if (!video || isNaN(video.duration) || video.duration === 0) return;

  const progress = (video.currentTime / video.duration) * 100;

  if (progress >= 98 || ad) {
    const nextBtn = document.querySelector('#navigation-button-down > ytd-button-renderer > yt-button-shape > button');
    if (nextBtn) nextBtn.click();
  }
}

setInterval(autoSkipShorts, 500);