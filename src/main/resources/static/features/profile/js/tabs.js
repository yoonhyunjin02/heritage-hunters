// tabs.js
import { $, $$, setHidden } from "./utils.js";

/**
 * 프로필 탭 초기화
 * - 중복 초기화 방지
 * - a11y: tablist, tab, tabpanel, aria-labelledby/controls, 키보드(좌우/Home/End/Enter/Space)
 * - indicator 위치/크기 계산 안전화
 */
export function initTabs() {
  const nav = $(".profile-tabs");
  const panelsContainer = $(".profile-panels");
  if (!nav || !panelsContainer) return;
  if (nav.dataset.initialized === "true") return;
  nav.dataset.initialized = "true";

  nav.setAttribute("role", "tablist");

  const tabs = $$(".tab-btn", nav);
  const panels = $$(".tab-panel", panelsContainer);

  // 탭/패널 개수 불일치 방어
  const len = Math.min(tabs.length, panels.length);
  if (len === 0) return;

  // ID/연결 관계 보정
  tabs.forEach((btn, i) => {
    btn.setAttribute("role", "tab");
    if (!btn.id) btn.id = `tab-${i}`;
    const panel = panels[i];
    panel.setAttribute("role", "tabpanel");
    if (!panel.id) panel.id = `panel-${i}`;
    btn.setAttribute("aria-controls", panel.id);
    panel.setAttribute("aria-labelledby", btn.id);
  });

  const indicator = $(".tab-indicator", nav);

  const activate = (idx) => {
    if (!tabs[idx] || !panels[idx]) return;

    tabs.forEach((t, i) => {
      const active = i === idx;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      setHidden(panels[i], !active);
    });

    if (indicator) {
      // 레이아웃 확정 후 계산
      requestAnimationFrame(() => {
        const activeTab = tabs[idx];
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      });
    }

    // 탭 변경 이벤트
    nav.dispatchEvent(
      new CustomEvent("tabchange", {
        bubbles: true,
        detail: {
          index: idx,
          panel: panels[idx],
          tab: tabs[idx],
          panelId: panels[idx].id,
          tabId: tabs[idx].id,
        },
      })
    );
  };

  // 클릭/키보드
  tabs.forEach((btn, idx) => {
    btn.addEventListener("click", () => activate(idx));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate(idx);
      }
    });
  });

  nav.addEventListener("keydown", (e) => {
    const currentIndex = tabs.findIndex((t) => t.classList.contains("is-active"));
    let newIndex = currentIndex;

    if (e.key === "ArrowRight") newIndex = (currentIndex + 1) % len;
    else if (e.key === "ArrowLeft") newIndex = (currentIndex - 1 + len) % len;
    else if (e.key === "Home") newIndex = 0;
    else if (e.key === "End") newIndex = len - 1;

    if (newIndex !== currentIndex) {
      e.preventDefault();
      tabs[newIndex].focus();
      activate(newIndex);
    }
  });

  // 초기 활성화
  const initialIdx = Math.max(
    0,
    tabs.findIndex((t) => t.classList.contains("is-active"))
  );
  activate(initialIdx);

  // 리사이즈 시 indicator 재계산
  if (indicator) {
    window.addEventListener("resize", () => {
      const activeIdx = tabs.findIndex((t) => t.classList.contains("is-active"));
      if (activeIdx >= 0) {
        requestAnimationFrame(() => {
          const activeTab = tabs[activeIdx];
          indicator.style.width = `${activeTab.offsetWidth}px`;
          indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
        });
      }
    });
  }
}

/**
 * 현재 활성 패널을 반환합니다.
 * @returns {Element|null}
 */
export function getActivePanel() {
  const panelsContainer = $(".profile-panels");
  if (!panelsContainer) return null;
  return $(".tab-panel:not([hidden])", panelsContainer) || $(".tab-panel.is-active", panelsContainer) || null;
}
