# CoCoNuT YouTube Extension

CoCoNuT is a Chrome extension that adds convenience features to YouTube.

## Features

- **Quality preference:** Save a preferred playback quality and reapply it when YouTube changes videos through its single-page navigation.
- **Picture-in-Picture:** Start or stop PiP from the popup or the configured keyboard shortcut.
- **PiP seeking shortcuts:** Seek backward or forward by 10 seconds while PiP is active.
- **Shorts auto-advance:** Move to the next Short when the current video ends and attempt to skip clearly labeled advertisements.
- **Localization:** Korean and English interface strings.
- **Appearance:** Light/dark theme and a customizable accent color.

## Development

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Select **Load unpacked** and choose this repository directory.
4. Open a YouTube video and test the popup features.

After changing extension files, use **Reload** on the extension details page and refresh the YouTube tab so the updated content scripts are loaded.

## Notes

- YouTube changes its player UI and internal player APIs over time. Quality selection and advertisement detection therefore require periodic compatibility testing.
- Automatic advertisement skipping depends on YouTube exposing a recognizable advertisement label in the page.
- Keyboard shortcuts can be changed at `chrome://extensions/shortcuts`.
- The extension stores the preferred quality and Shorts toggle in `chrome.storage.local`. Theme and accent settings are stored in the extension page's local storage.
