(() => {
  // background에서 중복 주입해도 한 번만 동작하도록 방지
  if (window.__coconutContentLoaded) return;
  window.__coconutContentLoaded = true;

  // 지원 언어: 한국어 / 영어
  const QUALITY_MENU_KEYWORDS = ["화질", "quality"];

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(fn, timeout = 1500, step = 50) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await wait(step);
    }
    return null;
  }

  const labelOf = (el) =>
    (el.querySelector(".ytp-menuitem-label")?.textContent || el.textContent || "")
      .replace(/ /g, " ")
      .trim();
  const isAuto = (label) => /auto|자동/i.test(label);
  const isPremium = (label) => /premium|프리미엄/i.test(label);
  const parseHeight = (label) => {
    const m = label.match(/(\d{3,4})p/);
    return m ? parseInt(m[1], 10) : null;
  };

  function getCurrentPlaybackQuality() {
    const v = document.querySelector("video.html5-main-video");
    return v && v.videoHeight ? `${v.videoHeight}p` : null;
  }

  // ---------- 화질 메뉴 조작 ----------
  // 영상이 지원하는 화질 목록은 설정(톱니) → 화질 메뉴를 실제로 열어야만 얻을 수 있다.
  // 메뉴가 화면에 깜빡이지 않도록 작업 중에는 숨겨 둔다.

  function findQualityMenuItem() {
    return [...document.querySelectorAll(".ytp-settings-menu .ytp-menuitem")].find((el) => {
      const text = labelOf(el).toLowerCase();
      return QUALITY_MENU_KEYWORDS.some((k) => text.includes(k));
    });
  }

  function getQualityItems() {
    let items = [...document.querySelectorAll(".ytp-quality-menu .ytp-menuitem")];
    if (!items.length) {
      items = [...document.querySelectorAll(".ytp-settings-menu .ytp-menuitem")].filter((el) => {
        const l = labelOf(el);
        return parseHeight(l) !== null;
      });
    }
    items = items.filter((el) => {
      const l = labelOf(el);
      return isAuto(l) || parseHeight(l) !== null;
    });
    return items.length ? items : null;
  }

  let busy = false;

  async function withQualityMenu(fn) {
    while (busy) await wait(100);
    busy = true;

    const btn = document.querySelector(".ytp-settings-button");
    if (!btn) {
      busy = false;
      return null;
    }

    const style = document.createElement("style");
    style.textContent = ".ytp-popup.ytp-settings-menu{opacity:0 !important;}";
    document.documentElement.appendChild(style);

    const wasOpen = btn.getAttribute("aria-expanded") === "true";
    try {
      if (!wasOpen) btn.click();

      const menuItem = await waitFor(findQualityMenuItem);
      if (!menuItem) return null;
      menuItem.click();

      const items = await waitFor(getQualityItems);
      if (!items) return null;

      return fn(items);
    } finally {
      // 실패하더라도 메뉴가 열린 채로 남지 않게 닫는다.
      await wait(50);
      if (!wasOpen && btn.getAttribute("aria-expanded") === "true") btn.click();
      style.remove();
      busy = false;
    }
  }

  async function listQualities() {
    const result = await withQualityMenu((items) => items.map(labelOf));
    return result || [];
  }

  // preferred: "Auto" 또는 "1440p" 같은 값.
  // 선호 화질을 넘는 영상이면 그 영상이 지원하는 최대 화질로, 지원하면 선호 화질 그대로 맞춘다.
  async function applyQuality(preferred) {
    const ok = await withQualityMenu((items) => {
      const entries = items.map((el) => ({ el, label: labelOf(el) }));

      let target;
      if (preferred === "Auto") {
        target = entries.find((e) => isAuto(e.label));
      } else {
        const want = parseHeight(preferred);
        if (!want) return false;

        const list = entries
          .filter((e) => !isAuto(e.label))
          .map((e) => ({ ...e, h: parseHeight(e.label) }))
          .sort((a, b) => b.h - a.h || Number(isPremium(a.label)) - Number(isPremium(b.label)));

        target = list.find((e) => e.h <= want) || list[list.length - 1];
      }

      if (!target) return false;
      target.el.click();
      return true;
    });
    return !!ok;
  }

  // ---------- 새 영상이 열릴 때마다 저장된 선호 화질 재적용 ----------
  let timer = null;
  function scheduleAutoApply() {
    clearTimeout(timer);
    timer = setTimeout(autoApply, 1200);
  }

  async function autoApply() {
    try {
      if (!location.pathname.startsWith("/watch")) return;

      const { preferredQuality } = await chrome.storage.local.get("preferredQuality");
      // Auto는 유튜브 기본 동작이므로 영상 전환 시에는 건드리지 않는다.
      if (!preferredQuality || preferredQuality === "Auto") return;

      // 광고 재생 중에는 건너뜀 (본 영상이 로드되면 loadedmetadata가 다시 호출된다)
      const player = document.getElementById("movie_player");
      if (player?.classList.contains("ad-showing")) return;

      await applyQuality(preferredQuality);
    } catch (e) {
      // 확장 프로그램이 재로드되어 컨텍스트가 끊긴 경우 등
    }
  }

  document.addEventListener("yt-navigate-finish", scheduleAutoApply);
  document.addEventListener(
    "loadedmetadata",
    (e) => {
      if (e.target?.matches?.("video.html5-main-video")) scheduleAutoApply();
    },
    true
  );
  scheduleAutoApply();

  // ---------- 팝업과의 통신 ----------
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "GET_QUALITIES") {
      listQualities().then((availableQualities) =>
        sendResponse({ availableQualities, currentQuality: getCurrentPlaybackQuality() })
      );
      return true;
    }
    if (msg?.type === "SET_QUALITY") {
      applyQuality(msg.quality).then((ok) => sendResponse({ ok }));
      return true;
    }
  });
})();
