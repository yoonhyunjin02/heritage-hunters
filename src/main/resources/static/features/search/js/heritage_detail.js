// src/main/resources/static/features/search/js/heritage_detail.js

/**
 * 상수/선택자/문구
 */
const C = {
  SELECTOR: {
    thumbImg: ".heritage__summary__info figure img",
    addresses: ".heritage__summary__info address",
    content: ".heritage__content",
    refreshBtns: ".ai-refresh",
  },
  AI_TARGET: {
    recommends: "#ai-recommends",
    weather: "#ai-weather",
    news: "#ai-news",
    summary: "#ai-summary",
  },
  CLASS: {
    toast: "toast-message",
    skeleton: "skeleton-text",
    overlay: "lightbox-overlay",
    contentToggleBtn: "content-toggle-btn",
    collapsed: "collapsed",
  },
  MSG: {
    loading: "정보를 불러오는 중입니다...",
    empty: "응답이 비어 있어요.",
    aiFail: "AI 응답을 불러오지 못했어요.",
    copied: "주소가 복사되었습니다",
    copyFail: "복사에 실패했습니다",
  },
  UI: {
    maxContentHeight: 100,
  },
};

/**
 * 공통 유틸
 */
const U = {
  /**
   * 단일 요소 선택
   * @param {string} sel
   * @returns {Element|null}
   */
  qs(sel) {
    return document.querySelector(sel);
  },

  /**
   * 다중 요소 선택
   * @param {string} sel
   * @returns {NodeListOf<Element>}
   */
  qsa(sel) {
    return document.querySelectorAll(sel);
  },

  /**
   * URL에서 heritage id 추출
   * @returns {number}
   */
  getHeritageId() {
    return Number(window.location.pathname.split("/").pop());
  },

  /**
   * AI 공통 payload(이름/주소/본문) 구성
   * @returns {{name:string,address:string,content:string}}
   */
  getHeritagePayloadBase() {
    const data = window.HERITAGE_DETAIL || {};
    if (!data.id) {
      const $d = document.getElementById("heritage-data");
      if ($d) {
        data.id = Number($d.dataset.id);
        data.name = $d.dataset.name || "";
        data.address = $d.dataset.address || "";
        data.content = $d.dataset.content || "";
      }
    }
    return {
      name: data.name || "",
      address: data.address || "",
      content: data.content || "",
    };
  },

  /**
   * 현재 시각 초 기반 로테이션 client code(1~3)
   * @returns {number}
   */
  clientCodeOf() {
    const now = new Date();
    const sec = now.getSeconds();
    return (sec % 3) + 1;
  },

  /**
   * CSRF 메타 태그 읽기
   * @returns {{token:string, header:string}}
   */
  getCsrf() {
    const tokenEl = document.querySelector('meta[name="_csrf"]');
    const headerEl = document.querySelector('meta[name="_csrf_header"]');
    return {
      token: tokenEl?.content ?? "",
      header: headerEl?.content ?? "X-CSRF-TOKEN",
    };
  },

  /**
   * JSON POST 요청
   * @param {string} url
   * @param {Record<string, any>} body
   * @returns {Promise<Response>}
   */
  postJson(url, body) {
    const { token, header } = U.getCsrf();
    return fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [header]: token,
      },
      body: JSON.stringify(body),
    });
  },
};

/**
 * UI 모듈(토스트/라이트박스/로딩/텍스트/컨텐츠 토글)
 */
const UI = {
  /**
   * 토스트 표시
   * @param {string} message
   * @param {number} [duration=2000]
   * @returns {void}
   */
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

  /**
   * 라이트박스 오픈
   * @param {string} src
   * @param {string} alt
   * @returns {void}
   */
  openLightbox(src, alt) {
    const overlay = document.createElement("div");
    overlay.className = C.CLASS.overlay;
    overlay.innerHTML = `<div class="lightbox-content"><img src="${src}" alt="${alt}" /></div>`;
    document.body.append(overlay);
    overlay.addEventListener("click", () => overlay.remove());
  },

  /**
   * 로딩 상태 세팅
   * @param {string} selector
   * @param {string} [btnSelector]
   * @returns {void}
   */
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

  /**
   * 로딩 상태 해제
   * @param {string} selector
   * @param {string} [btnSelector]
   * @returns {void}
   */
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

  /**
   * 텍스트 업데이트
   * @param {string} selector
   * @param {string} text
   * @returns {void}
   */
  setText(selector, text) {
    const el = U.qs(selector);
    if (el) el.textContent = text ?? "";
  },

  /**
   * 본문 컨텐츠 토글 버튼 초기화
   * @param {number} [maxHeight=100]
   * @returns {void}
   */
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

// 키 스케줄러: Round-Robin + 429 회피
const KeyRR = {
  queue: [1, 2, 3],
  // code -> expireAt(ms)
  blacklist: new Map(),
  // 블랙리스트 유지 시간
  TTL_MS: 60 * 60 * 1000,

  initOffset() {
    const offset = Math.floor(Math.random() * this.queue.length); // 0~length-1
    this.queue = this.queue.slice(offset).concat(this.queue.slice(0, offset));
  },

  isBlocked(code) {
    const until = this.blacklist.get(code);
    if (!until) return false;
    if (Date.now() > until) {
      this.blacklist.delete(code);
      return false;
    }
    return true;
  },

  block(code, ttl = this.TTL_MS) {
    this.blacklist.set(code, Date.now() + ttl);
  },

  // 다음 사용 가능한 code 반환(블랙리스트는 건너뜀)
  next() {
    if (!this.queue.length) throw new Error("No keys configured");
    let tries = this.queue.length;
    while (tries-- > 0) {
      const code = this.queue.shift();
      this.queue.push(code); // 회전
      if (!this.isBlocked(code)) return code;
    }
    // 모두 블록이면 그냥 첫 번째 반환(어차피 서버가 거절하면 다시 블록됨)
    return this.queue[0];
  },

  // 특정 code를 뒤로 미룹니다(선택 사용)
  use(code) {
    const idx = this.queue.indexOf(code);
    if (idx > -1) {
      this.queue.splice(idx, 1);
      this.queue.push(code);
    }
  },
};

/**
 * AI 모듈(요청/리셋/페치 핸들링)
 */
const AI = {
  /**
   * /heritage/:id/ai POST
   * @param {number} heritageId
   * @param {{type:string, code:number, name:string, address:string, content:string}} payload
   * @returns {Promise<{content?:string}>}
   */
  async ask(heritageId, payload) {
    const res = await U.postJson(`/heritage/${heritageId}/ai`, payload);
    // 상태 코드를 보존해서 상위에서 429 판별 가능하게 함
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  /**
   * /heritage/:id/ai/reset POST
   * @param {number} heritageId
   * @param {{type:string, code:number}} payload
   * @returns {Promise<void>}
   */
  async reset(heritageId, payload) {
    const res = await U.postJson(`/heritage/${heritageId}/ai/reset`, payload);
    if (!res.ok) throw new Error(`reset HTTP ${res.status}`);
  },

  /**
   * AI 콘텐츠 요청→UI 반영
   * @param {number} heritageId
   * @param {string} selector
   * @param {"recommends"|"weather"|"news"|"summary"} type
   * @param {number} code
   * @param {{name:string,address:string,content:string}} base
   * @returns {Promise<void>}
   */
  async fetchContent(heritageId, selector, type, code, base) {
    const btnSelector = `.ai-refresh[data-type="${type}"]`;
    UI.setLoading(selector, btnSelector);
    const start = performance.now();
    try {
      // 1차 시도
      let json;
      try {
        json = await AI.ask(heritageId, { type, code, ...base });
      } catch (e) {
        // 429면 해당 code 블랙리스트 + 다른 code로 1회 재시도
        if (e && e.status === 429) {
          console.warn(`429 for code=${code}, blacklist & retry`);
          KeyRR.block(code);
          const retryCode = KeyRR.next();
          json = await AI.ask(heritageId, { type, code: retryCode, ...base });
        } else {
          throw e;
        }
      }
      const markdown = json?.content ?? C.MSG.empty;
      const html = window.marked.parse(markdown);
      const target = U.qs(selector);
      if (target) target.innerHTML = html;
    } catch (e) {
      console.error(e);
      UI.setText(selector, C.MSG.aiFail);
    } finally {
      UI.unsetLoading(selector, btnSelector);
      console.log(`type: ${type}, code: ${code}, ⏱ ${Math.round(performance.now() - start)}ms`);
    }
  },
};

/**
 * App 모듈(이벤트 바인딩/초기 로드)
 */
const App = {
  /**
   * 이미지/주소/컨텐츠 토글 초기화
   * @returns {void}
   */
  initSimpleInteractions() {
    // 이미지 라이트박스
    const img = U.qs(C.SELECTOR.thumbImg);
    if (img) {
      img.style.cursor = "pointer";
      img.addEventListener("click", () => UI.openLightbox(img.src, img.alt));
    }
    // 주소 복사
    U.qsa(C.SELECTOR.addresses).forEach((addr) => {
      addr.style.cursor = "pointer";
      addr.title = "클릭하여 주소 복사";
      addr.addEventListener("click", () => {
        navigator.clipboard
          .writeText(addr.textContent.trim())
          .then(() => UI.showToast(C.MSG.copied))
          .catch(() => UI.showToast(C.MSG.copyFail));
      });
    });
    // 본문 토글
    UI.initContentToggle();
  },

  /**
   * 초기 AI 요청 및 버튼 핸들러 등록
   * @returns {void}
   */
  initAi() {
    const heritageId = U.getHeritageId();
    const base = U.getHeritagePayloadBase();

    // 새로고침/접속 시 랜덤하게 queue 출발점 결정
    KeyRR.initOffset();

    // 초기 로드: 라운드로빈으로 코드 선택
    AI.fetchContent(heritageId, C.AI_TARGET.recommends, "recommends", KeyRR.next(), base);
    AI.fetchContent(heritageId, C.AI_TARGET.weather, "weather", KeyRR.next(), base);
    AI.fetchContent(heritageId, C.AI_TARGET.news, "news", KeyRR.next(), base);
    AI.fetchContent(heritageId, C.AI_TARGET.summary, "summary", KeyRR.next(), base);

    // 새로고침 버튼
    U.qsa(C.SELECTOR.refreshBtns).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const type = btn.dataset.type;
        if (!type || !C.AI_TARGET[type]) return;

        // data-code가 있으면 그걸 쓰고, 없으면 라운드로빈
        // (운영 중 data-code 제거하면 모두 RR로 일원화됨)
        const code = btn.dataset.code ? Number(btn.dataset.code) : KeyRR.next();
        const selector = C.AI_TARGET[type];
        const btnSelector = `.ai-refresh[data-type="${type}"]`;

        UI.setLoading(selector, btnSelector);

        try {
          await AI.reset(heritageId, { type, code });
          console.log(`✅ reset 성공 - ${type}`);
        } catch (e) {
          console.warn("⚠️ reset 실패(계속 진행):", e.message);
        }
        await AI.fetchContent(heritageId, selector, type, code, base);
      });
    });
  },

  /**
   * 부트스트랩
   * @returns {void}
   */
  boot() {
    App.initSimpleInteractions();
    App.initAi();
  },
};

document.addEventListener("DOMContentLoaded", () => App.boot());
