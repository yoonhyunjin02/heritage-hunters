import { getEls } from "/common/js/utils/dom.js";

/**
 * 프로필 탭 UI 초기화
 */
export default function initTabs() {
  const tabs = getEls(".profile-tabs .tab-btn");
  const panels = getEls(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("aria-controls");

      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel) => {
        panel.hidden = panel.id !== target;
      });
    });
  });
}
