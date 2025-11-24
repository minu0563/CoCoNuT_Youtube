// 페이지 로드 시 기본 색상 체크 및 설정
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('selectedColor', (data) => {
    if (!data.selectedColor) {
      // 기본 색상 없으면 기본 색상 설정
      const defaultColor = '#e0e0e0'; // 기본 색상 (황금색)
      chrome.storage.sync.set({ selectedColor: defaultColor }, () => {
        console.log('✅ 기본 색상 설정 완료:', defaultColor);
        console.log('aaaaaaaa')
      });
    }
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  checkAndRefreshShortsPage(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    checkAndRefreshShortsPage(tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.autoSkipEnabled !== undefined) {
    // 자동 스킵 상태 변경
    chrome.storage.sync.set({ shortAutoSkipEnabled: message.autoSkipEnabled }, () => {
      // 상태 업데이트 후 필요한 추가 작업 수행 (예: content script에 신호 보내기)
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);  // 현재 탭만 새로 고침
      });
    });
  }
});

// 'shorts'가 URL에 포함된 경우 새로고침
function checkAndRefreshShortsPage(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    const url = tab.url;

    // URL에 'shorts'가 포함되어 있으면 새로고침
    if (url && url.includes('shorts')) {
      // 해당 탭에 대해서 이미 새로 고침이 이루어졌는지 체크
      chrome.storage.sync.get('refreshedTabs', (data) => {
        const refreshedTabs = data.refreshedTabs || [];

        if (!refreshedTabs.includes(tabId)) {
          // 새로 고침이 안 된 경우에만 새로 고침 수행
          chrome.tabs.reload(tabId);
          console.log('📺 쇼츠 페이지로 이동하여 새로고침 실행됨');

          // 새로 고침한 탭 ID 저장
          refreshedTabs.push(tabId);
          chrome.storage.sync.set({ refreshedTabs }, () => {
            console.log('📚 새로 고침된 탭 기록 저장');
          });
        } else {
          console.log('🚫 이미 새로 고침된 탭이므로 스킵');
        }
      });
    }
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-pip") {
    chrome.storage.sync.get("pipOn", (data) => {
      const newState = !data.pipOn;

      // 상태 저장
      chrome.storage.sync.set({ pipOn: newState });

      // 현재 탭에서 PiP 실행
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              const video = document.querySelector("video");
              if (video && video.requestPictureInPicture) {
                video.requestPictureInPicture().catch((e) =>
                  console.error("단축키 PiP 실패:", e)
                );
              }
            },
          });
        }
      });
    });
  }
});
