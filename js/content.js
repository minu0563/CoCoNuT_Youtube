chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setQuality") {
    const quality = request.quality;

    const qualityMap = {
      "144p": "tiny",
      "240p": "small",
      "360p": "medium",
      "480p": "large",
      "720p": "hd720",
      "1080p": "hd1080",
      "1440p": "hd1440",
      "2160p": "hd2160",
      "4320p": "hd4320"
    };

    const internalQuality = qualityMap[quality] || quality;

    const trySetQuality = () => {
      const ytPlayer = document.getElementById("movie_player");

      if (
        ytPlayer &&
        typeof ytPlayer.setPlaybackQuality === "function" &&
        ytPlayer.getAvailableQualityLevels
      ) {
        const levels = ytPlayer.getAvailableQualityLevels();
        console.log("🎞️ 사용 가능한 화질:", levels);

        if (levels.includes(internalQuality)) {
          ytPlayer.setPlaybackQuality(internalQuality);
          ytPlayer.setPlaybackQualityRange?.(internalQuality);
          console.log(`✅ 화질 설정됨: ${quality} (${internalQuality})`);
        } else {
          console.warn(`⚠️ ${quality} (${internalQuality}) 화질은 현재 영상에서 사용 불가`);
        }
      } else {
        console.log("⏳ 플레이어가 아직 로드되지 않음, 재시도...");
        setTimeout(trySetQuality, 500);
      }
    };

    trySetQuality();
  }
});
