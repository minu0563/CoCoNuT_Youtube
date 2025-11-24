function getPlayerResponse() {
  return window.ytInitialPlayerResponse || window.ytplayer?.config?.args?.player_response;
}

function getAvailableQualities() {
  let response = getPlayerResponse();
  if (!response) return [];
  if (typeof response === 'string') response = JSON.parse(response);
  const streamingData = response?.streamingData;
  if (!streamingData) return [];
  const formats = (streamingData.formats || []).concat(streamingData.adaptiveFormats || []);
  
  const qualities = [...new Set(formats.map(f => f.qualityLabel).filter(Boolean))];

  const hasAuto = qualities.some(q => q.toLowerCase() === 'auto' || q.includes('자동'));
  if (!hasAuto) {
    qualities.unshift('Auto');
  }

  return qualities;
}

function getCurrentPlaybackQuality() {
  const videoElement = document.querySelector('video.html5-main-video');
  if (videoElement && videoElement.videoHeight) {
    return `${videoElement.videoHeight}p`;
  }

  const qualityTextElement = document.querySelector('.ytp-menuitem[aria-checked="true"] .ytp-menuitem-label');
  if (qualityTextElement && qualityTextElement.textContent.includes('p')) {
    const match = qualityTextElement.textContent.match(/(\d+p)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_QUALITIES') {
    (async () => {
      let qualities = getAvailableQualities();
      let retries = 0;
      const MAX_RETRIES = 5;
      const DELAY_MS = 200;

      while (qualities.length === 0 && retries < MAX_RETRIES) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        qualities = getAvailableQualities();
      }
      
      sendResponse({ 
        availableQualities: qualities,
        currentQuality: getCurrentPlaybackQuality()
      });
    })();
    return true;
  }
});