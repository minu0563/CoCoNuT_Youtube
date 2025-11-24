function applyColorChange(selectedColor) {
    console.log("📢 applyColorChange 실행됨! 적용할 색상:", selectedColor);

    document.documentElement
    document.documentElement
    document.documentElement
    document.documentElement
    document.documentElement
    document.documentElement

    console.log("✅ CSS 변수 변경 완료! 현재 적용된 값:", selectedColor);
}

// 색상 저장 (사용자가 선택한 색상)
const el_color = document.getElementById('apply-color-button')
if (el_color) el_color.addEventListener('click', () => {
     const selectedColor = document.getElementById('color-picker').value;
    if (!selectedColor) return;

    // 색상 저장
    chrome.storage.sync.set({ selectedColor: selectedColor }, () => {
        console.log("✅ Selected Color Saved: ", selectedColor);

        // popup에서도 즉시 적용
        applyColorChange(selectedColor);

        // 모든 탭에 색상 적용
        chrome.runtime.sendMessage({ action: "applyColorToAllTabs", color: selectedColor });
    });
});

// 화이트 모드 적용 함수
function WH() {
    chrome.storage.sync.get('selectedColor', (data) => {
        const selectedColor = data.selectedColor || '#ffd700'; // 저장된 색상 없으면 기본 색상
        document.documentElement
        document.documentElement
        document.documentElement
        document.documentElement
        document.documentElement
        document.documentElement
        document.documentElement
        document.documentElement
        document.documentElement

        chrome.runtime.sendMessage({ action: "WhiteMod", w: true });
        chrome.storage.sync.set({ isWhiteMode: true });
    });
}

function DK() {
    document.documentElement
    document.documentElement
}


// let lang = "en"

document.addEventListener("DOMContentLoaded", () => {
    // 저장된 언어가 없으면 기본값을 영어로 설정
    chrome.storage.sync.get("selectedLanguage", (data) => {
      lang = data.selectedLanguage || "en";
    });
});

// 화이트 모드 및 다크 모드 전환 버튼 이벤트 리스너
const el_wh = document.getElementById('WH')
if(el_wh) el_wh.addEventListener('click', () => {
    const button = document.getElementById('WH');

    // 화이트 모드 활성화 / 다크 모드 활성화
    chrome.storage.sync.get('isWhiteMode', (data) => {
        if (data.isWhiteMode) {
            DK();
            // 화이트 모드가 활성화되어 있으면 다크모드로 전환
            if (button) button.innerText = translations[lang]["White Mode"];
            chrome.storage.sync.remove('isWhiteMode', () => {
                // 기본 색상 복원
                chrome.storage.sync.get('selectedColor', (data) => {
                    const selectedColor = data.selectedColor || '#ffd700'; // 기본 색상 선택
                    applyColorChange(selectedColor);
                });
            });
        } else {
            // 다크모드가 활성화되어 있으면 화이트 모드로 전환
            button.innerText = translations[lang]["Dark Mode"];
            WH(); // 화이트 모드로 전환
        }
    });
});

// 페이지 로드 시 화이트 모드 상태 확인 후 적용
chrome.storage.sync.get('isWhiteMode', (data) => {
    const button = document.getElementById('WH');
    if (button) {
    if (data.isWhiteMode) {
        if (button) button.innerText = translations[lang]["Dark Mode"]; // 화이트 모드가 활성화되었으면 "다크모드"로 변경
        WH(); // 화이트 모드 스타일 적용
    } else {
        // 다크 모드 스타일 적용 (기본 색상)
        chrome.storage.sync.get('selectedColor', (data) => {
            const selectedColor = data.selectedColor || '#ffd700'; // 기본 색상 선택
            applyColorChange(selectedColor);
        });
        button.innerText = translations[lang]["White Mode"]; // 기본 상태로 텍스트 설정
    }}
});