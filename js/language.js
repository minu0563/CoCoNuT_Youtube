document.addEventListener("DOMContentLoaded", () => {
  // 저장된 언어가 없으면 기본값을 영어로 설정
  chrome.storage.sync.get("selectedLanguage", (data) => {
    const lang = data.selectedLanguage || "en"; // 기본 언어를 영어(en)로 설정
    applyLanguage(lang);
  });

  // 언어 선택 버튼 이벤트 리스너 추가
  document.querySelectorAll(".language").forEach(button => {
    button.addEventListener("click", function () {
      const selectedLang = this.dataset.lang;

      // 선택한 언어를 저장
      chrome.storage.sync.set({ selectedLanguage: selectedLang }, () => {
        applyLanguage(selectedLang); // 언어 변경 시 applyLanguage 호출
      });
    });
  });

  // 뒤로 가기 버튼
  const el_bk = document.getElementById("setting-back")
  if (el_bk) el_bk.addEventListener("click", function () {
    window.location.href = "setting.html";  // 'index.html'로 돌아가기
  });

  // 자동 스킵 버튼 이벤트 리스너
  const autoSkipButton = document.getElementById('short-autoskip');
  chrome.storage.sync.get('shortAutoSkipEnabled', ({ shortAutoSkipEnabled }) => {
    // 초기 버튼 상태 설정
    if (autoSkipButton) autoSkipButton.textContent = shortAutoSkipEnabled ? '자동 스킵: ON' : '자동 스킵: OFF';
  });

  if (autoSkipButton) autoSkipButton.addEventListener('click', () => {
    chrome.storage.sync.get('shortAutoSkipEnabled', ({ shortAutoSkipEnabled }) => {
      const newState = !shortAutoSkipEnabled;
      chrome.storage.sync.set({ shortAutoSkipEnabled: newState }, () => {
        // 상태 토글 후 버튼 텍스트 갱신
        autoSkipButton.textContent = newState ? '자동 스킵: ON' : '자동 스킵: OFF';

        // 언어에 맞춰 버튼 텍스트 갱신
        chrome.storage.sync.get("selectedLanguage", (data) => {
          const lang = data.selectedLanguage || "en";
          applyLanguage(lang); // 상태 변경 후 언어에 맞게 텍스트 갱신
        });
      });
    });
  });
});

function applyLanguage(lang) {
  const translations = {
    "en": {
      "Select Language": "Select Language",
      "Back": "Back",
      "Select Quality": "Select Quality",
      "Color Selection": "Color Selection",
      "Save Color": "Save Color",
      "Languages": "Languages",
      "YouTube Settings": "YouTube Settings",
      "White Mode": "White Mode",
      "Dark Mode": "Dark Mode",
      "Convert to MP3": "Convert to MP3",
      "Switch to PiP Mode": "Switch to PiP Mode",
      "Visit Website": "Visit Website", // 추가된 부분
      "Short Auto Skip": "Short Auto Skip", // 추가된 부분
      "Setting Extension": "Setting Extension",
      ": Choose your preferred video quality, which will be applied to all other videos as well.": ": Choose your preferred video quality, which will be applied to all other videos as well.",
      ": Enable Picture-in-Picture (PiP) mode for both YouTube videos and Shorts. Quickly toggle PiP mode on or off using the Ctrl + Q shortcut.":": Enable Picture-in-Picture (PiP) mode for both YouTube videos and Shorts. Quickly toggle PiP mode on or off using the Ctrl + Q shortcut.",
      ": Visit the CoCoNuT website (Beta) to resize and adjust the quality of your images.":": Visit the CoCoNuT website (Beta) to resize and adjust the quality of your images.",
      ": Automatically skip YouTube Shorts videos. When enabled, the text changes to ON; when disabled, it shows OFF. This feature works even if PiP mode is active.":": Automatically skip YouTube Shorts videos. When enabled, the text changes to ON; when disabled, it shows OFF. This feature works even if PiP mode is active.",
      ": Click the donut-shaped icon at the top-right corner to change the extension’s theme color and language settings.":": Click the donut-shaped icon at the top-right corner to change the extension’s theme color and language settings."
    },
    "ko": {
      "Select Language": "언어 선택",
      "Back": "뒤로 가기",
      "Select Quality": "화질 선택",
      "Color Selection": "색 선택",
      "Save Color": "색 저장",
      "Languages": "언어 선택",
      "White Mode": "화이트 모드",
      "Dark Mode": "다크 모드",
      "Convert to MP3": "MP3 변환",
      "Switch to PiP Mode": "PiP 모드로 전환",
      "Visit Website": "웹사이트 방문", // 추가된 부분
      "Short Auto Skip": "쇼츠 자동 넘기기", // 추가된 부분
      "Setting Extension": "익스텐션 설정",
      ": Choose your preferred video quality, which will be applied to all other videos as well.": ": 원하는 동영상 화질을 선택하세요. 이 설정은 모든 동영상에 적용됩니다.",
      ": Enable Picture-in-Picture (PiP) mode for both YouTube videos and Shorts. Quickly toggle PiP mode on or off using the Ctrl + Q shortcut.":": 유튜브 동영상과 쇼츠 모두에서 PIP(Picture-in-Picture) 모드를 활성화합니다. Ctrl + Q 단축키로 빠르게 켜고 끌 수 있습니다.",
      ": Visit the CoCoNuT website (Beta) to resize and adjust the quality of your images.":": CoCoNuT 웹사이트(베타)에서 이미지 크기 조절과 화질 변경을 할 수 있습니다.",
      ": Automatically skip YouTube Shorts videos. When enabled, the text changes to ON; when disabled, it shows OFF. This feature works even if PiP mode is active.":": 유튜브 쇼츠 영상을 자동으로 넘깁니다. 활성화 시 텍스트가 ON으로 바뀌고, 비활성화 시 OFF로 표시됩니다. PiP 모드가 켜져 있어도 작동합니다.",
      ": Click the donut-shaped icon at the top-right corner to change the extension’s theme color and language settings.":": 우측 상단 도넛 모양 아이콘을 클릭해 익스텐션의 테마 색상과 언어 설정을 변경할 수 있습니다."
    },
    "ja": {
      "Select Language": "言語を選択",
      "Back": "戻る",
      "Select Quality": "画質選択",
      "Color Selection": "色の選択",
      "Save Color": "色を保存",
      "Languages": "言語選択",
      "White Mode": "ホワイトモード",
      "Dark Mode": "ダークモード",
      "Convert to MP3": "MP3に変換",
      "Switch to PiP Mode": "PiPモードに切り替え",
      "Visit Website": "ウェブサイトを訪問", // 추가된 부분
      "Short Auto Skip": "ショートの自動スキップ", // 추가된 부분
      "Setting Extension": "拡張機能の設定",
      ": Choose your preferred video quality, which will be applied to all other videos as well.":": お好みの動画画質を選択してください。この設定はすべての動画に適用されます。",
      ": Enable Picture-in-Picture (PiP) mode for both YouTube videos and Shorts. Quickly toggle PiP mode on or off using the Ctrl + Q shortcut.":": YouTube動画とショートの両方でピクチャーインピクチャー（PiP）モードを有効にします。Ctrl + Qのショートカットで素早くオン/オフを切り替え可能です。",
      ": Visit the CoCoNuT website (Beta) to resize and adjust the quality of your images.":": CoCoNuTウェブサイト（ベータ）で画像のサイズ変更や画質調整ができます。",
      ": Automatically skip YouTube Shorts videos. When enabled, the text changes to ON; when disabled, it shows OFF. This feature works even if PiP mode is active.":": YouTubeショート動画を自動的にスキップします。有効にするとテキストがONに変わり、無効にするとOFFが表示されます。PiPモードが有効でも機能します。", 
      ": Click the donut-shaped icon at the top-right corner to change the extension’s theme color and language settings.":": 右上のドーナツ型アイコンをクリックして、拡張機能のテーマカラーと言語設定を変更できます。"
    },
    "zh": {
      "Select Language": "选择语言",
      "Back": "返回",
      "Select Quality": "选择画质",
      "Color Selection": "选择颜色",
      "Save Color": "保存颜色",
      "Languages": "选择语言",
      "White Mode": "白色模式",
      "Dark Mode": "黑暗模式",
      "Convert to MP3": "转换为MP3",
      "Switch to PiP Mode": "切换到PiP模式",
      "Visit Website": "访问网站", // 추가된 부분
      "Short Auto Skip": "自动跳过短片", // 추가된 부분
      "Setting Extension": "扩展设置",
      ": Choose your preferred video quality, which will be applied to all other videos as well.":": 选择您喜欢的视频画质，该设置将应用于所有其他视频。",
      ": Enable Picture-in-Picture (PiP) mode for both YouTube videos and Shorts. Quickly toggle PiP mode on or off using the Ctrl + Q shortcut.":": 启用YouTube视频和短视频的画中画（PiP）模式。您可以使用 Ctrl + Q 快捷键快速开启或关闭PiP模式。",
      ": Visit the CoCoNuT website (Beta) to resize and adjust the quality of your images.":": 访问CoCoNuT网站（测试版）以调整图像大小和画质。",
      ": Automatically skip YouTube Shorts videos. When enabled, the text changes to ON; when disabled, it shows OFF. This feature works even if PiP mode is active.":": 自动跳过YouTube短视频。启用时文本显示为ON，禁用时显示为OFF。即使PiP模式激活，此功能依然有效。",
      ": Click the donut-shaped icon at the top-right corner to change the extension’s theme color and language settings.":": 点击右上角的甜甜圈图标更改扩展的主题颜色和语言设置。"

    }
  };

  // 해당 언어로 페이지 텍스트 변경
  if (translations[lang]) {
    changeTextRecursively(document.body, translations[lang]);
  }

  // 텍스트를 재귀적으로 변경하는 함수
  function changeTextRecursively(element, translations) {
    if (element.nodeType === Node.TEXT_NODE) {
      // 텍스트 노드인 경우, 텍스트 변경
      const currentText = element.textContent.trim();
      if (translations[currentText]) {
        element.textContent = translations[currentText];
      }
    } else {
      // 자식 요소들에 대해서도 반복
      element.childNodes.forEach(child => {
        changeTextRecursively(child, translations);
      });
    }
  }
}