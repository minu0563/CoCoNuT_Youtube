// ==============================
// DOM 요소 가져오기
// ==============================
const languageSelect = document.getElementById("languageSelect");
const saveButton = document.getElementById("saveButton");
const backButton = document.getElementById("backButton");
const titleElement = document.getElementById("title");
const languageLabel = document.getElementById("languageLabel");

// ==============================
// 다국어 텍스트
// ==============================
const translations = {
  ko: { title: "설정", saveBtn: "저장", backBtn: "←", languageLabel: "언어 선택" },
  en: { title: "Settings", saveBtn: "Save", backBtn: "←", languageLabel: "Language" },
  ja: { title: "設定", saveBtn: "保存", backBtn: "←", languageLabel: "言語選択" },
  zh: { title: "设置", saveBtn: "保存", backBtn: "←", languageLabel: "选择语言" }
};

// ==============================
// 저장된 테마와 언어 적용
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  const storedLang = localStorage.getItem("selectedLanguage") || "ko";
  const storedTheme = localStorage.getItem("selectedTheme") || "light";

  // 테마 적용
  document.documentElement.setAttribute("data-theme", storedTheme);

  // 언어 적용
  if (translations[storedLang]) {
    titleElement.textContent = translations[storedLang].title;
    saveButton.textContent = translations[storedLang].saveBtn;
    backButton.textContent = translations[storedLang].backBtn;
    languageLabel.textContent = translations[storedLang].languageLabel;
    languageSelect.value = storedLang;
  }
});

// ==============================
// 저장 버튼 클릭 → index.html 이동
// ==============================
saveButton.addEventListener("click", () => {
  const selectedLang = languageSelect.value;
  localStorage.setItem("selectedLanguage", selectedLang);
  window.location.href = "index.html";
});

// ==============================
// 뒤로가기 버튼
// ==============================
backButton.addEventListener("click", () => {
  window.history.back();
});
