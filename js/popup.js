const qualitySelect = document.getElementById('qualitySelect');
const currentQualityDisplay = document.getElementById('detectedQuality');

document.addEventListener('DOMContentLoaded', () => {
  const shortAuto = document.getElementById("shortAuto");
  const switchEl = shortAuto.parentElement;
  const sh = document.getElementById("shortStatus");

  chrome.storage.local.get(["shortAuto"], (result) => {
    const saved = result.shortAuto === true;
    if (shortAuto) shortAuto.checked = saved;
    if (switchEl) switchEl.classList.toggle("active", saved);
    if (sh) sh.innerHTML = saved ? "쇼츠 자동넘김: 켜짐" : "쇼츠 자동넘김: 꺼짐";
  });

  if (shortAuto) {
    shortAuto.addEventListener("change", () => {
      const checked = shortAuto.checked;
      chrome.storage.local.set({ "shortAuto": checked });
      
      if (sh) sh.innerHTML = checked ? "쇼츠 자동넘김: 켜짐" : "쇼츠 자동넘김: 꺼짐";
      if (switchEl) switchEl.classList.toggle("active", checked);
    });
  }
});

function getCurrentPlaybackQuality() {
    const videoElement = document.querySelector('video.html5-main-video');
    if (videoElement && videoElement.videoHeight) {
        return `${videoElement.videoHeight}p`;
    }

    const qualityTextElement = document.querySelector('.ytp-menuitem[aria-checked="true"] .ytp-menuitem-label');
    if (qualityTextElement && qualityTextElement.textContent.includes('p')) {
        const cleanedText = qualityTextElement.textContent.replace(/\u00A0/g, ' '); 
        const match = cleanedText.match(/(\d+p)/);
        if (match) {
            return match[1];
        }
    }
    return null;
}


function detectAvailableQualities() {
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    return (async () => {
        const settingsBtn = document.querySelector('.ytp-settings-button');
        if (!settingsBtn) return [];

        settingsBtn.click();
        await wait(100);

        const menuItems = [...document.querySelectorAll('.ytp-menuitem')];
        const qualityMenu = menuItems.find(item => {
            const label = item.querySelector('.ytp-menuitem-label');
            if (!label) return false;
            
            const text = label.textContent.toLowerCase();
            const cleanText = text.replace(/\u00A0/g, ' ');

            // 12개 언어 키워드를 || 연산자로 검색하도록 복원
            return cleanText.includes('화질') || 
                   cleanText.includes('quality') || 
                   cleanText.includes('画質') || 
                   cleanText.includes('画质') || 
                   cleanText.includes('qualité') ||
                   cleanText.includes('qualität') || 
                   cleanText.includes('kwaliteit') || 
                   cleanText.includes('kalidad') || 
                   cleanText.includes('kualitas') || 
                   cleanText.includes('qualidade') || 
                   cleanText.includes('جودة') || 
                   cleanText.includes('качество');
        });

        if (!qualityMenu) {
            document.querySelector('.ytp-settings-button')?.click();
            return [];
        }

        qualityMenu.click();
        await wait(100);

        const qualityOptions = [...document.querySelectorAll('.ytp-menuitem-label')];
        const available = qualityOptions.map(option => option.textContent.trim())
            .filter(text => /p/.test(text.toLowerCase()) || /^(자동|auto)$/i.test(text));

        document.querySelector('.ytp-settings-button')?.click();
        return available;
    })();
}

function updateCurrentQuality(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: getCurrentPlaybackQuality,
    }).then((results) => {
        const currentQuality = results?.[0]?.result;
        
        if (currentQualityDisplay) {
            if (currentQuality) {
                currentQualityDisplay.textContent = chrome.i18n.getMessage("current_quality_display", [currentQuality]);
            } else {
                currentQualityDisplay.textContent = chrome.i18n.getMessage("quality_not_detected");
            }
        }

        if (currentQuality) {
            qualitySelect.innerHTML = `<option value="${currentQuality}" selected>${currentQuality}</option>`;
            qualitySelect.dataset.loaded = 'false';
        } else {
            qualitySelect.innerHTML = `<option value="" disabled selected>${chrome.i18n.getMessage("detection_failed")}</option>`;
            qualitySelect.dataset.loaded = 'true';
        }
        
    }).catch(() => {
        if (currentQualityDisplay) {
            currentQualityDisplay.textContent = chrome.i18n.getMessage("player_loading_error");
        }
        qualitySelect.innerHTML = `<option value="" disabled selected>${chrome.i18n.getMessage("detection_error")}</option>`;
        qualitySelect.dataset.loaded = 'true';
    });
}

function loadAvailableQualities(tabId) {
    if (qualitySelect.dataset.loaded === 'true') {
        return;
    }
    
    const currentText = qualitySelect.options[0]?.text || chrome.i18n.getMessage("loading_text");
    qualitySelect.innerHTML = `<option value="" disabled selected>${chrome.i18n.getMessage("loading_available_qualities")}</option>`;

    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: detectAvailableQualities,
    }).then((results) => {
        const availableQualities = results?.[0]?.result || [];
        
        if (!availableQualities.length) {
            qualitySelect.innerHTML = `<option value="" disabled selected>${chrome.i18n.getMessage("no_available_qualities")}</option>`;
            return;
        }
        
        qualitySelect.dataset.loaded = 'true';
        qualitySelect.innerHTML = ''; 
        
        availableQualities.forEach(q => {
            const isAuto = q.toLowerCase() === 'auto' || q.toLowerCase().includes('자동');
            
            const option = document.createElement('option');
            option.value = isAuto ? 'Auto' : q;
            option.textContent = q;
            
            if (isAuto) {
                qualitySelect.prepend(option);
            } else {
                qualitySelect.appendChild(option);
            }
        });
        
        const currentOption = [...qualitySelect.options].find(opt => opt.text === currentText);
        if (currentOption) {
            currentOption.selected = true;
        }

    }).catch(() => {
        qualitySelect.innerHTML = `<option value="" disabled selected>${chrome.i18n.getMessage("detection_failed")}</option>`;
        qualitySelect.dataset.loaded = 'true';
    });
}

function setQuality(tabId, preferredQuality) {
    function applyQuality(quality) {
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        (async () => {
            const settingsBtn = document.querySelector('.ytp-settings-button');
            if (!settingsBtn) return;

            settingsBtn.click();
            await wait(100);

            const menuItems = [...document.querySelectorAll('.ytp-menuitem')];
            const qualityMenu = menuItems.find(item => {
                const label = item.querySelector('.ytp-menuitem-label');
                if (!label) return false;
                
                const text = label.textContent.toLowerCase();
                const cleanText = text.replace(/\u00A0/g, ' ');

                // 12개 언어 키워드를 || 연산자로 검색하도록 복원
                return cleanText.includes('화질') || 
                       cleanText.includes('quality') || 
                       cleanText.includes('画質') || 
                       cleanText.includes('画质') || 
                       cleanText.includes('qualité') || 
                       cleanText.includes('qualität') || 
                       cleanText.includes('kwaliteit') || 
                       cleanText.includes('kalidad') || 
                       cleanText.includes('kualitas') || 
                       cleanText.includes('qualidade') || 
                       cleanText.includes('جودة') || 
                       cleanText.includes('качество');
            });

            if (!qualityMenu) return;

            qualityMenu.click();
            await wait(100);

            const qualityOptions = [...document.querySelectorAll('.ytp-menuitem')];
            const target = qualityOptions.find(item => {
                const label = item.querySelector('.ytp-menuitem-label');
                return label && label.textContent.includes(quality);
            });

            if (target) target.click();

            document.querySelector('.ytp-settings-button')?.click();
        })();
    }
    
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: applyQuality,
        args: [preferredQuality],
    }).then(() => {
        window.close();
    }).catch(() => {
        window.close();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        
        if (!tab || !tab.url || (!tab.url.includes('youtube.com/watch') && !tab.url.includes('youtube.com/shorts'))) {
            if (currentQualityDisplay) {
                currentQualityDisplay.textContent = chrome.i18n.getMessage("open_youtube_page");
            }
            qualitySelect.innerHTML = `<option value="" disabled selected>${chrome.i18n.getMessage("page_error")}</option>`;
            return;
        }
        
        updateCurrentQuality(tab.id);

        if (qualitySelect) {
            qualitySelect.addEventListener('mousedown', () => {
                loadAvailableQualities(tab.id);
            }, { once: true });

            qualitySelect.addEventListener('change', (event) => {
                const selectedQuality = event.target.value;
                setQuality(tab.id, selectedQuality);
            });
        }
    });
});