// utils.js

// -------------------------
// DOM 선택자 헬퍼
// -------------------------

/**
 * 지정한 셀렉터로 첫 번째 일치하는 요소를 반환합니다.
 * 유효하지 않은 셀렉터로 인한 예외를 방지합니다.
 *
 * @param {string} sel - CSS 선택자
 * @param {Document|Element} [ctx=document] - 탐색 범위
 * @returns {Element|null}
 */
export const $ = (sel, ctx = document) => {
  const scopeOK = ctx instanceof Document || ctx instanceof Element || ctx instanceof DocumentFragment;
  if (!scopeOK) return null;
  try {
    return ctx.querySelector(sel);
  } catch {
    return null;
  }
};

/**
 * 지정한 셀렉터로 모든 일치 요소를 배열로 반환합니다.
 * 유효하지 않은 셀렉터로 인한 예외를 방지합니다.
 *
 * @param {string} sel - CSS 선택자
 * @param {Document|Element} [ctx=document] - 탐색 범위
 * @returns {Element[]}
 */
export const $$ = (sel, ctx = document) => {
  const scopeOK = ctx instanceof Document || ctx instanceof Element || ctx instanceof DocumentFragment;
  if (!scopeOK) return [];
  try {
    return Array.from(ctx.querySelectorAll(sel));
  } catch {
    return [];
  }
};

// -------------------------
// URL 처리 헬퍼
// -------------------------

/**
 * 경로 템플릿의 매개변수를 안전하게 치환합니다.
 * 예: replacePathParams('/users/:id', { id: 123 })
 *
 * @param {string} pattern - 경로 템플릿
 * @param {Object} params - 치환할 키-값 쌍
 * @returns {string}
 * @throws {TypeError}
 */
export function replacePathParams(pattern, params = {}) {
  if (typeof pattern !== "string") throw new TypeError("pattern must be a string");
  return Object.entries(params).reduce((acc, [key, val]) => {
    if (val === undefined || val === null) return acc; // 누락값은 치환하지 않음
    const re = new RegExp(`:${key}(?=/|$)`, "g");
    return acc.replace(re, encodeURIComponent(String(val)));
  }, pattern);
}

/**
 * 기본 URL과 쿼리 파라미터 객체를 조합하여 URL 문자열을 생성합니다.
 * 절대/상대 URL 모두 지원합니다.
 *
 * @param {string} base - 기본 URL
 * @param {Object} query - 쿼리 파라미터 객체 (배열은 key=val1&key=val2 형태)
 * @returns {string}
 */
export function buildUrl(base, query = {}) {
  let urlObj;
  try {
    urlObj = new URL(base); // 절대 URL
  } catch {
    urlObj = new URL(base, window.location.origin); // 상대 URL
  }
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      urlObj.searchParams.delete(k);
      v.forEach((item) => urlObj.searchParams.append(k, String(item)));
    } else {
      urlObj.searchParams.set(k, String(v));
    }
  });
  return urlObj.toString();
}

// -------------------------
// 네트워크 요청
// -------------------------

/**
 * HTML meta 태그에서 CSRF 토큰을 가져옵니다.
 * @returns {string|null}
 */
function getCsrfToken() {
  return $('meta[name="csrf-token"]')?.getAttribute("content") || null;
}

/**
 * JSON 요청을 안전하게 처리하는 fetch 래퍼 함수입니다.
 *
 * - GET/HEAD에는 body를 넣지 않습니다.
 * - 객체 body는 자동 JSON.stringify (FormData/Blob/URLSearchParams 제외)
 * - same-origin & 변경 요청 시 X-CSRF-Token 자동 주입 (동일 호스트일 때만)
 * - timeout(ms) 지정 가능 (AbortController)
 * - 204/205 응답은 null
 * - 응답 Content-Type이 JSON이 아니면 text로 반환
 * - 오류 시 status, data, url, method, code(TimeoutError/AbortError 등) 포함
 *
 * @param {string} url
 * @param {Object} [options={}]
 * @returns {Promise<any>}
 */
export async function fetchJSON(url, options = {}) {
  const { method = "GET", headers = {}, body, credentials = "same-origin", signal, timeout } = options;

  const methodUpper = method.toUpperCase();
  const isChangingMethod = !["GET", "HEAD"].includes(methodUpper);

  // body 처리
  let finalBody = body;
  const isObjectBody =
    isChangingMethod && body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof URLSearchParams);

  const init = {
    method: methodUpper,
    credentials,
    headers: { ...headers },
  };

  if (isObjectBody) {
    init.headers["Content-Type"] ||= "application/json";
    finalBody = JSON.stringify(body);
  }

  if (["GET", "HEAD"].includes(methodUpper)) {
    finalBody = undefined; // GET/HEAD에는 body 금지
  } else {
    init.body = finalBody;
  }

  // CSRF (same-origin + 동일 호스트)
  if (isChangingMethod && credentials === "same-origin") {
    const targetHost = (() => {
      try {
        return new URL(url, window.location.origin).host;
      } catch {
        return window.location.host;
      }
    })();
    if (targetHost === window.location.host) {
      const token = getCsrfToken();
      if (token && !init.headers["X-CSRF-Token"]) {
        init.headers["X-CSRF-Token"] = token;
      }
    }
  }

  // AbortController + timeout
  const controller = new AbortController();
  const timerId = timeout && Number.isFinite(timeout) ? setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeout) : null;

  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  init.signal = controller.signal;

  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (timerId) clearTimeout(timerId);
    const e = new Error(`네트워크 오류: ${err.message || err}`);
    e.cause = err;
    e.url = url;
    e.method = methodUpper;
    e.code = err?.name === "AbortError" ? "AbortError" : err?.name || "NetworkError";
    throw e;
  }
  if (timerId) clearTimeout(timerId);

  // 204/205
  if (res.status === 204 || res.status === 205) {
    return null;
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const isJson = contentType.includes("application/json") || contentType.endsWith("+json");

  // 에러 응답
  if (!res.ok) {
    let data = null;
    try {
      data = isJson ? await res.json() : await res.text();
    } catch {
      // ignore
    }
    const err = new Error(`HTTP ${res.status} ${res.statusText || ""}`.trim());
    err.status = res.status;
    err.data = data;
    err.url = url;
    err.method = methodUpper;
    err.code = "HttpError";
    throw err;
  }

  // 정상 응답
  if (isJson) {
    try {
      return await res.json();
    } catch (parseErr) {
      const e = new Error("유효하지 않은 JSON 응답");
      e.cause = parseErr;
      e.url = url;
      e.method = methodUpper;
      e.code = "InvalidJSON";
      throw e;
    }
  }
  return await res.text();
}

// -------------------------
// DOM 표시/숨김
// -------------------------

/**
 * 요소를 숨기거나 표시합니다. hidden/aria-hidden을 동기화합니다.
 *
 * @param {Element} el
 * @param {boolean} hidden
 * @returns {Element}
 */
export function setHidden(el, hidden) {
  if (!el) return el;
  if (hidden) {
    el.setAttribute("hidden", "");
    el.setAttribute("aria-hidden", "true");
  } else {
    el.removeAttribute("hidden");
    el.setAttribute("aria-hidden", "false");
  }
  return el;
}

// -------------------------
// 이미지 폴백 처리
// -------------------------

/**
 * 이미지 로드 실패 시 지정된 폴백 이미지를 적용합니다.
 * - 무한 루프 방지
 * - srcset/sizes 제거
 * - 중복 리스너 방지
 *
 * @param {HTMLImageElement} img
 */
export function applyImageFallback(img) {
  if (!img) return;
  if (img.dataset.fallbackApplied === "true") return;
  const fallback = img.dataset.fallback;
  if (!fallback) return;

  const onError = () => {
    if (img.src === fallback) return;
    img.onerror = null;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.src = fallback;
  };

  img.addEventListener("error", onError, { once: true });
  img.dataset.fallbackApplied = "true";
}
