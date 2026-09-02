(() => {
  if (window.__shortAutoSkipLoaded) return; 
  window.__shortAutoSkipLoaded = true;

  let isAutoSkipOn = false;
  let skipCooldown = false;
  let lastUrl = location.href;

  chrome.storage.local.get(['shortAuto'], (r) => {
    isAutoSkipOn = r.shortAuto === true;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.shortAuto) {
      isAutoSkipOn = changes.shortAuto.newValue === true;
    }
  });

  const adWords = [
    "ad","ads","sponsored","sponsor","광고","advertisement",
    "annonce","publicité","werbung","iklan","patrocinado",
    "anúncio","广告","廣告","広告","реклама","إعلان","اعلان"
  ];

  function isAdBadge() {
    const badge = document.querySelector(".yt-badge-shape__text");
    if (!badge) return false;
    const text = badge.innerText.trim().toLowerCase().replace(/\s+/g, "");
    return adWords.some(w => text.includes(w));
  }

  function doSkip(nextBtn) {
    if (!nextBtn || skipCooldown) return;
    skipCooldown = true;
    nextBtn.click();
    setTimeout(() => { skipCooldown = false; }, 1000);
  }

  function trySkipShort() {
    if (!isAutoSkipOn) return;                
    if (!location.href.includes("/shorts/")) return;

    const video = document.querySelector("video");
    const nextBtn = document.querySelector('#navigation-button-down button');
    if (!video || !nextBtn) return;     

    const progress = (video.currentTime / video.duration) * 100;
    if (isAdBadge() || progress >= 98) doSkip(nextBtn);
  }

  setInterval(() => {
    if (location.href !== lastUrl) { lastUrl = location.href; skipCooldown = false; }
  }, 200);
  setInterval(trySkipShort, 350);
})();