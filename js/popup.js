document.addEventListener("DOMContentLoaded", () => {
  const qualityButtonsContainer = document.getElementById("quality-buttons");
  const qualityStatus = document.getElementById("quality-status");
  const pipStatus = document.getElementById("pip-status");
  const pipToggleButton = document.getElementById("toggle-pip");

  // 저장된 화질 불러오기
  chrome.storage.sync.get("selectedQuality", (data) => {
    if (data.selectedQuality) {
      qualityStatus.textContent = `선택된 화질: ${data.selectedQuality}`;
    }
  });

  // 현재 탭에서 사용 가능한 화질 목록 받아와서 버튼 생성
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          const player = document.querySelector('video');
          const ytPlayer = document.querySelector('ytd-player') || document.querySelector('#movie_player');
          if (ytPlayer && ytPlayer.getAvailableQualityLevels) {
            return ytPlayer.getAvailableQualityLevels();
          }
          return ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', '4320p'];
        },
      },
      (results) => {
        const qualityList = results?.[0]?.result || ['360p', '720p', '1080p'];
        qualityButtonsContainer.innerHTML = '';

        qualityList.forEach((quality) => {
          const btn = document.createElement("button");
          btn.textContent = quality;
          btn.className = "quality-btn";
          btn.addEventListener("click", () => {
            chrome.storage.sync.set({ selectedQuality: quality }, () => {
              qualityStatus.textContent = `선택된 화질: ${quality}`;

              // 현재 탭에 화질 변경 메시지 전송
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "setQuality",
                quality: quality
              });
            });
          });
          qualityButtonsContainer.appendChild(btn);
        });
      }
    );
  });

  // 저장된 PIP 모드 불러오기
  chrome.storage.sync.get("pipEnabled", (data) => {
    const pipEnabled = data.pipEnabled === true;
    pipStatus.textContent = pipEnabled ? "PIP 모드: 사용 중" : "PIP 모드: 꺼짐";
  });

  // PIP 모드 전환
  pipToggleButton.addEventListener("click", () => {
    chrome.storage.sync.get("pipEnabled", (data) => {
      const current = data.pipEnabled === true;
      const newStatus = !current;
      chrome.storage.sync.set({ pipEnabled: newStatus }, () => {
        pipStatus.textContent = newStatus ? "PIP 모드: 사용 중" : "PIP 모드: 꺼짐";
      });
    });
  });
});
