import { getEl } from "./utils/dom.js";

function getCsrfHeaders() {
  const token = getEl("meta[name='_csrf']").content;
  const header = getEl("meta[name='_csrf_header']").content;
  return { [header]: token };
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...getCsrfHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  // 204이거나 Content-Length가 0이면 null 반환
  if (res.status === 204) {
    return null;
  }

  // 일부 서버는 200이라도 빈 body를 줄 수 있으니 방어적으로 처리
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function getJSON(url) {
  return fetchJSON(url);
}

export function postJSON(url, body) {
  return fetchJSON(url, { method: "POST", body: JSON.stringify(body) });
}

export function putJSON(url, body) {
  return fetchJSON(url, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteJSON(url) {
  return fetchJSON(url, { method: "DELETE" });
}
