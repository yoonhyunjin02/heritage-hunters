// DOM 조회 헬퍼
export function getEl(selector, root = document) {
  const el = root.querySelector(selector);
  // if (!el) console.warn(`Element not found: ${selector}`);
  return el;
}

export function getEls(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}
