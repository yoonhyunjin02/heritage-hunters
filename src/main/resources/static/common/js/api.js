import { getEl } from "./utils/dom.js";

export function getCsrfHeaders() {
  const token = getEl("meta[name='_csrf']").content;
  const header = getEl("meta[name='_csrf_header']").content;
  return { [header]: token };
}

// 에러 응답 처리 유틸
async function handleErrorResponse(res) {
  let userMessage = "알 수 없는 오류가 발생했습니다."; // 기본값
  let debugMessage = res.statusText;

  try {
    const errData = await res.json();
    if (errData?.message) {
      debugMessage = errData.message;
      // 4xx일 때만 서버 메시지를 그대로 사용자에게 전달
      if (res.status >= 400 && res.status < 500) {
        userMessage = errData.message;
      } else if (res.status >= 500) {
        userMessage = "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
    }
  } catch {
    try {
      const text = await res.text();
      debugMessage = text || debugMessage;
    } catch {}
  }

  console.error(`API Error ${res.status}:`, debugMessage); // 개발자 콘솔용

  const error = new Error(userMessage);
  error.status = res.status;
  throw error;
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
    await handleErrorResponse(res);
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
    await handleErrorResponse(res);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
