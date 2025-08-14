import { $, $$, setHidden } from "./utils.js";

export function initTabs() {
  const nav = $(".profile-tabs");
  if (!nav) return;

  const tabs = $$(".tab-btn", nav);
  const panels = $$(".tab-panel", $(".profile-panels"));
  const indicator = $(".tab-indicator", nav);

  const activate = (idx) => {
    tabs.forEach((t, i) => {
      const active = i === idx;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active);
      t.tabIndex = active ? 0 : -1;
      setHidden(panels[i], !active);
    });
    indicator.style.transform = `translateX(${idx * 100}%)`;
  };

  tabs.forEach((btn, idx) => {
    btn.addEventListener("click", () => activate(idx));
  });

  const initialIdx = tabs.findIndex((t) => t.classList.contains("is-active"));
  activate(initialIdx >= 0 ? initialIdx : 0);
}
