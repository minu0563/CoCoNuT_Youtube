document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');
    const themeIcon = document.getElementById('themeIcon');
    const selectedColor = localStorage.getItem('selectedColor');

    if (selectedColor) {
        document.documentElement.style.setProperty('--accent', selectedColor);
    } else  {
        document.documentElement.style.setProperty('--accent', '#2563eb');
    }

    // --- 기존 번역 및 테마 기능 ---
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
            "lightLabel",
            "extensionName",
            "defaultTitle",
            "current_quality_display",
            "quality_not_detected",
            "detection_failed",
            "player_loading_error",
            "detection_error",
            "loading_text",
            "loading_available_qualities",
            "no_available_qualities",
            "open_youtube_page",
            "page_error",
            "short_enabled",
            "short_on",
            "short_off",
            "pipmasage",
            "pipmasage2",
            "settingtitle",
            "goshortcut",
            "shortcut1",
            "shortcut2",
            "shortcut3",
            "shortcutLabel",
            "shortcutHelp",
            "changeColorLabel",
            "changeColorHelp",
            "changeColor",
            "resetLabel"
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = chrome.i18n.getMessage(id);
        });
        const theme = localStorage.getItem("selectedTheme") || "light";
        if (themeLabel)
            themeLabel.textContent = theme === "dark"
                ? chrome.i18n.getMessage("darkLabel")
                : chrome.i18n.getMessage("lightLabel");
    }
    applyTranslations();

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeIcon)
            themeIcon.src = theme === 'dark' ? '../dark.png' : '../white.png';
        if (themeLabel)
            themeLabel.textContent = theme === 'dark'
                ? chrome.i18n.getMessage("darkLabel")
                : chrome.i18n.getMessage("lightLabel");
    }

    const storedTheme = localStorage.getItem("selectedTheme") || "light";
    applyTheme(storedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            applyTheme(next);
            localStorage.setItem('selectedTheme', next);
        });
    }

    const backBtn = document.getElementById("back");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "index.html"; 
        });
    }
});

const short = document.getElementById("shortlink");
if (short) {
    short.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts'});
    })
}

document.addEventListener("DOMContentLoaded", () => {
    const shortAuto = document.getElementById("shortAuto");

    // i18n 기반 alert 함수
    function showLocalizedAlert(messageId, placeholders = []) {
        const msg = chrome.i18n.getMessage(messageId, placeholders);
        if (msg) {
            alert(msg);
        }
    }

    if (shortAuto) {
        shortAuto.addEventListener("click", function() {
            if (this.checked) {
                showLocalizedAlert("short_enabled");
            } else {
                showLocalizedAlert("short_disabled");
            }
        });
    }
});


// 색상 설정 요소는 setting.html에만 존재하므로 요소가 있을 때만 이벤트를 등록한다.
const colorPicker = document.getElementById("colorPicker");
const changeColor = document.getElementById("changeColorBtn");
const resetBtn = document.getElementById("reset");

if (colorPicker) {
    colorPicker.value = localStorage.getItem("selectedColor") || "#2563eb";

    colorPicker.addEventListener("input", () => {
        document.documentElement.style.setProperty("--accent", colorPicker.value);
        localStorage.setItem("selectedColor", colorPicker.value);
    });
}

if (changeColor && colorPicker) {
    changeColor.addEventListener("click", () => {
        colorPicker.showPicker();
    });
}

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        localStorage.removeItem("selectedColor");
        document.documentElement.style.setProperty("--accent", "#2563eb");
        if (colorPicker) colorPicker.value = "#2563eb";
    });
}