import { getEl } from "./utils/dom.js";

export function getCsrfHeaders() {
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

  if (res.status === 204) {
    return null;
  }

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

/**
 * 멀티파트 PUT 요청용 헬퍼
 * @param {string} url
 * @param {FormData} formData
 */
export async function putMultipart(url, formData) {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...getCsrfHeaders(), // Content-Type은 설정하지 않음
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
