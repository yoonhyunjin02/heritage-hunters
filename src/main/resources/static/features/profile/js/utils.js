// utils.js
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const replaceId = (pattern, id) => (typeof pattern === "string" ? pattern.replace(":id", String(id)) : null);

export const setHidden = (el, hidden) => el && (hidden ? el.setAttribute("hidden", "") : el.removeAttribute("hidden"));
