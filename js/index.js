const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const themeIcon = document.getElementById('themeIcon');

function applyTranslations() {
  const ids = [
    "mainTitle",
    "qualityLabel",
    "qualityHelp",
    "pipLabel",
    "pipHelp",
    "pipBtn",
    "pipStatus",
    "shortLabel",
    "shortHelp",
    "shortStatus",
    "footerText",
    "darkLabel",
    "lightLabel"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = chrome.i18n.getMessage(id);
  });
  const theme = localStorage.getItem("selectedTheme") || "light";
  themeLabel.textContent = theme === "dark"
    ? chrome.i18n.getMessage("darkLabel")
    : chrome.i18n.getMessage("lightLabel");
}

applyTranslations();

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeIcon.src = theme === 'dark' ? '../dark.png' : '../white.png';
  themeLabel.textContent = theme === 'dark'
    ? chrome.i18n.getMessage("darkLabel")
    : chrome.i18n.getMessage("lightLabel");
}

const storedTheme = localStorage.getItem("selectedTheme") || "light";
applyTheme(storedTheme);

themeBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('selectedTheme', next);
});
