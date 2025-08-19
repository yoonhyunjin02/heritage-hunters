// infinite_scroller.js
import { fetchJSON } from "./utils.js";

/**
 * 무한 스크롤러
 * - IntersectionObserver 기반
 * - page/cursor 기반 페이징 모두 지원
 * - 안전한 콜백 실행 및 중복 attach 방지
 */
export class InfiniteScroller {
  /**
   * @param {Object} options
   * @param {Element} options.listEl - 아이템이 append될 컨테이너(ul/ol/div)
   * @param {Element} options.sentinelEl - 관찰 대상 센티넬
   * @param {string} options.endpoint - API 엔드포인트(절대/상대)
   * @param {Object} [options.params={}] - 초기 쿼리 (page, size, cursor 등)
   * @param {(item:any)=>Node} options.renderItem - 아이템을 DOM Node로 렌더
   * @param {(loading:boolean)=>void} [options.onLoading] - 로딩 상태 콜백
   * @param {(err:Error)=>void} [options.onError] - 오류 콜백
   * @param {string} [options.rootMargin="800px 0px"] - 옵저버 rootMargin
   */
  constructor({ listEl, sentinelEl, endpoint, params = {}, renderItem, onLoading, onError, rootMargin = "800px 0px" }) {
    if (!(listEl instanceof Element)) throw new TypeError("listEl is required");
    if (!(sentinelEl instanceof Element)) throw new TypeError("sentinelEl is required");
    if (typeof endpoint !== "string" || !endpoint) throw new TypeError("endpoint is required");
    if (typeof renderItem !== "function") throw new TypeError("renderItem must be a function");

    this.listEl = listEl;
    this.sentinelEl = sentinelEl;
    this.endpoint = endpoint;
    this.params = { ...params };
    this.renderItem = renderItem;
    this.onLoading = onLoading || (() => {});
    this.onError = onError || (() => {});
    this.done = false;
    this.loading = false;
    this.started = false;
    this.emptyStreak = 0; // 빈 응답 연속 카운트

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.loadMore();
        }
      },
      { rootMargin }
    );
  }

  buildURL() {
    // endpoint에 이미 쿼리가 있으면 merge
    const url = new URL(this.endpoint, window.location.origin);
    Object.entries(this.params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, v);
    });
    return url.toString();
  }

  parsePaging(data) {
    const items = data?.items || data?.content || [];
    const hasMore = data?.hasMore ?? data?.last === false ?? Boolean(data?.nextCursor);
    const nextCursor = data?.nextCursor ?? (this.params.page ?? 0) + 1;
    return { items, nextCursor, hasMore };
  }

  async loadMore() {
    if (this.loading || this.done) return;
    this.loading = true;
    this.safely(() => this.onLoading(true));
    this.sentinelEl.setAttribute("aria-busy", "true");
    this.listEl.setAttribute("aria-busy", "true");

    try {
      const data = await fetchJSON(this.buildURL());
      const { items, nextCursor, hasMore } = this.parsePaging(data);

      if (!Array.isArray(items) || items.length === 0) {
        this.emptyStreak += 1;
        if (!hasMore || this.emptyStreak >= 2) {
          // 빈 응답 2회면 중단
          this.done = true;
          this.stop();
        }
        return;
      }
      this.emptyStreak = 0;

      const frag = document.createDocumentFragment();
      for (const item of items) {
        const node = this.renderItem(item);
        if (!(node instanceof Node)) {
          throw new TypeError("renderItem must return a DOM Node");
        }
        frag.appendChild(node);
      }
      this.listEl.appendChild(frag);

      if (!hasMore) {
        this.done = true;
        this.stop();
      } else {
        if (data?.nextCursor != null) this.params.cursor = data.nextCursor;
        if (this.params.page != null) this.params.page = nextCursor;
      }
    } catch (err) {
      console.error("무한 스크롤 로딩 실패:", err);
      this.safely(() => this.onError(err));
    } finally {
      this.loading = false;
      this.safely(() => this.onLoading(false));
      this.sentinelEl.setAttribute("aria-busy", "false");
      this.listEl.setAttribute("aria-busy", "false");
    }
  }

  start({ immediate = false } = {}) {
    if (this.started) return;
    this.started = true;
    this.observer.observe(this.sentinelEl);
    if (immediate) this.loadMore();
  }

  stop() {
    this.observer.disconnect();
    this.loading = false;
  }

  safely(fn) {
    try {
      fn();
    } catch {
      // 콜백 예외는 삼킴
    }
  }
}
