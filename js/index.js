// ==============================
// 🌍 다국어 텍스트
// ==============================
const translations = {
  ko: {
    mainTitle: "YouTube Setting",
    qualityLabel: "화질 고정",
    qualityHelp: "동영상 시작 시 자동으로 설정",
    pipLabel: "PiP 모드",
    pipHelp: "현재 탭의 동영상을 화면 밖에서도 보기",
    pipBtn: "PiP 실행",
    pipStatus: "PiP: 감지 대기",
    shortLabel: "쇼츠 자동 넘김",
    shortHelp: "shorts 페이지에서 자동으로 다음 영상",
    shortStatus: "쇼츠 자동넘김: 꺼짐",
    footerText: "설정은 자동 저장됩니다."
  },
  en: {
    mainTitle: "YouTube Setting",
    qualityLabel: "Quality Lock",
    qualityHelp: "Automatically set at video start",
    pipLabel: "PiP Mode",
    pipHelp: "View video outside of current tab",
    pipBtn: "Start PiP",
    pipStatus: "PiP: Waiting",
    shortLabel: "Auto Skip Shorts",
    shortHelp: "Automatically go to next video on shorts page",
    shortStatus: "Auto Skip: Off",
    footerText: "Settings are saved automatically."
  },
  ja: {
    mainTitle: "YouTube設定",
    qualityLabel: "画質固定",
    qualityHelp: "動画開始時に自動設定",
    pipLabel: "PiPモード",
    pipHelp: "現在のタブの動画を画面外でも見る",
    pipBtn: "PiP開始",
    pipStatus: "PiP: 待機中",
    shortLabel: "ショーツ自動スキップ",
    shortHelp: "ショーツページで次の動画に自動移動",
    shortStatus: "自動スキップ: オフ",
    footerText: "設定は自動保存されます。"
  },
  zh: {
    mainTitle: "YouTube设置",
    qualityLabel: "画质固定",
    qualityHelp: "视频开始时自动设置",
    pipLabel: "PiP模式",
    pipHelp: "在当前标签页外观看视频",
    pipBtn: "启动PiP",
    pipStatus: "PiP: 等待中",
    shortLabel: "短视频自动跳过",
    shortHelp: "在shorts页面自动跳到下一个视频",
    shortStatus: "自动跳过: 关闭",
    footerText: "设置会自动保存。"
  }
};

// ==============================
// 🌍 선택된 언어 적용
// ==============================
const selectedLang = localStorage.getItem("selectedLanguage") || "ko";

function applyTranslations() {
  for (const id in translations[selectedLang]) {
    const el = document.getElementById(id);
    if (el) el.textContent = translations[selectedLang][id];
  }
}

// 초기 적용
applyTranslations();

// ==============================
// 🌗 Light / Dark Theme Handling
// ==============================
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
  themeIcon.src = theme === 'dark' ? '../dark.png' : '../white.png';
}
  
// 저장된 테마 적용
const storedTheme = localStorage.getItem("selectedTheme") || "light";
applyTheme(storedTheme);

// 테마 전환
themeBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('selectedTheme', next);
});

// ==============================
// 🎞️ 화질 고정
// ==============================
const select = document.getElementById('qualitySelect');
const qualityStatus = document.getElementById('qualityStatus');

chrome.storage.sync.get({ preferredQuality: 'auto' }, ({ preferredQuality }) => {
  select.value = preferredQuality;
  qualityStatus.textContent = `화질: ${preferredQuality}`;
});

select.addEventListener('change', async () => {
  const quality = select.value;
  chrome.storage.sync.set({ preferredQuality: quality });
  qualityStatus.textContent = `화질: ${quality}`;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'setQuality', quality });
  }
});

// ==============================
// 📺 PiP 모드
// ==============================
const pipBtn = document.getElementById('pipBtn');
const pipStatus = document.getElementById('pipStatus');

async function togglePiP() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'togglePiP' }, response => {
    if (chrome.runtime.lastError) {
      pipStatus.textContent = 'PiP: 실패 (권한/페이지 확인)';
    } else {
      pipStatus.textContent = response?.pipEnabled ? 'PiP: 실행됨' : 'PiP: 종료됨';
    }
  });
}

pipBtn.addEventListener('click', togglePiP);

// ==============================
// 🎬 쇼츠 자동넘김
// ==============================
const shortToggle = document.getElementById('shortAuto');
const shortStatus = document.getElementById('shortStatus');
const switchEl = document.querySelector('.switch');

chrome.storage.sync.get({ shortAutoSkipEnabled: false }, ({ shortAutoSkipEnabled }) => {
  shortToggle.checked = shortAutoSkipEnabled;
  shortStatus.textContent = `쇼츠 자동넘김: ${shortAutoSkipEnabled ? '켜짐' : '꺼짐'}`;
  switchEl.classList.toggle('active', shortAutoSkipEnabled);
});

shortToggle.addEventListener('change', async () => {
  const enabled = shortToggle.checked;
  chrome.storage.sync.set({ shortAutoSkipEnabled: enabled });
  shortStatus.textContent = `쇼츠 자동넘김: ${enabled ? '켜짐' : '꺼짐'}`;
  switchEl.classList.toggle('active', enabled);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { autoSkipEnabled: enabled });
  }
});

// ==============================
// 🚀 초기화 (화질 동기화)
// ==============================
chrome.storage.sync.get({ preferredQuality: 'auto' }, async ({ preferredQuality }) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && preferredQuality !== 'auto') {
    chrome.tabs.sendMessage(tab.id, { action: 'setQuality', quality: preferredQuality });
  }
});
