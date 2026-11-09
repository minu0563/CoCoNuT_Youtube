document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const themeBtn = document.getElementById("themeToggle");
    const themeLabel = document.getElementById("themeLabel");
    const themeIcon = document.getElementById("themeIcon");
    const backBtn = document.getElementById("back");
    const colorPicker = document.getElementById("colorPicker");
    const changeColorBtn = document.getElementById("changeColorBtn");
    const resetBtn = document.getElementById("reset");

    const DEFAULT_ACCENT = "#2563eb";
    const selectedColor = localStorage.getItem("selectedColor") || DEFAULT_ACCENT;
    root.style.setProperty("--accent", selectedColor);

    function translateElements() {
        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const message = chrome.i18n.getMessage(element.dataset.i18n);
            if (message) element.textContent = message;
        });

        const ids = [
            "mainTitle", "qualityLabel", "qualityHelp", "pipLabel", "pipHelp",
            "shortLabel", "shortHelp", "shortStatus", "footerText", "settingtitle",
            "shortcutLabel", "shortcutHelp", "goshortcut", "changeColorLabel",
            "changeColorHelp", "changeColor", "resetLabel"
        ];

        ids.forEach((id) => {
            const element = document.getElementById(id);
            const message = chrome.i18n.getMessage(id);
            if (element && message) element.textContent = message;
        });
    }

    function applyTheme(theme) {
        const normalizedTheme = theme === "dark" ? "dark" : "light";
        root.dataset.theme = normalizedTheme;

        if (themeIcon) {
            themeIcon.src = normalizedTheme === "dark" ? "../dark.png" : "../white.png";
        }

        if (themeLabel) {
            themeLabel.textContent = chrome.i18n.getMessage(
                normalizedTheme === "dark" ? "darkLabel" : "lightLabel"
            );
        }
    }

    translateElements();
    applyTheme(localStorage.getItem("selectedTheme") || "light");

    themeBtn?.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        localStorage.setItem("selectedTheme", nextTheme);
        applyTheme(nextTheme);
    });

    backBtn?.addEventListener("click", () => {
        window.location.href = "index.html";
    });

    if (colorPicker) {
        colorPicker.value = selectedColor;
        colorPicker.addEventListener("input", () => {
            root.style.setProperty("--accent", colorPicker.value);
            localStorage.setItem("selectedColor", colorPicker.value);
        });
    }

    if (changeColorBtn && colorPicker) {
        changeColorBtn.addEventListener("click", () => {
            if (typeof colorPicker.showPicker === "function") {
                colorPicker.showPicker();
            } else {
                colorPicker.click();
            }
        });
    }

    resetBtn?.addEventListener("click", () => {
        localStorage.removeItem("selectedColor");
        root.style.setProperty("--accent", DEFAULT_ACCENT);
        if (colorPicker) colorPicker.value = DEFAULT_ACCENT;
    });

    const shortLink = document.getElementById("shortlink");
    shortLink?.addEventListener("click", (event) => {
        event.preventDefault();
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    });
});