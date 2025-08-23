// ui.js
import { C } from "./constants.js";
import { U } from "./utils.js";

export const UI = {
  showToast(message, duration = 2000) {
    const toast = document.createElement("div");
    toast.className = C.CLASS.toast;
    toast.textContent = message;
    document.body.append(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  },
  openLightbox(src, alt) {
    const overlay = document.createElement("div");
    overlay.className = C.CLASS.overlay;
    overlay.innerHTML = `<div class="lightbox-content"><img src="${src}" alt="${alt}" /></div>`;
    document.body.append(overlay);
    overlay.addEventListener("click", () => overlay.remove());
  },
  setLoading(selector, btnSelector) {
    const el = U.qs(selector);
    const btn = btnSelector ? U.qs(btnSelector) : null;
    if (el) {
      el.textContent = C.MSG.loading;
      el.classList.add(C.CLASS.skeleton);
    }
    if (btn) {
      btn.style.visibility = "hidden";
      btn.style.opacity = "0";
      btn.disabled = true;
    }
  },
  unsetLoading(selector, btnSelector) {
    const el = U.qs(selector);
    const btn = btnSelector ? U.qs(btnSelector) : null;
    if (el) el.classList.remove(C.CLASS.skeleton);
    if (btn) {
      btn.style.visibility = "visible";
      btn.style.opacity = "1";
      btn.disabled = false;
    }
  },
  setText(selector, text) {
    const el = U.qs(selector);
    if (el) el.textContent = text ?? "";
  },
  initContentToggle(maxHeight = C.UI.maxContentHeight) {
    const section = U.qs(C.SELECTOR.content);
    if (!section) return;
    if (section.scrollHeight > maxHeight) {
      section.classList.add(C.CLASS.collapsed);
      const btn = document.createElement("button");
      btn.className = C.CLASS.contentToggleBtn;
      btn.textContent = "더보기";
      section.after(btn);
      btn.addEventListener("click", () => {
        const collapsed = section.classList.toggle(C.CLASS.collapsed);
        btn.textContent = collapsed ? "더보기" : "접기";
      });
    }
  },
};
