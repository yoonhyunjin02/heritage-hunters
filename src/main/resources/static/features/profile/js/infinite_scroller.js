// infinite_scroller.js
import { fetchJSON } from "./utils.js";

export class InfiniteScroller {
  constructor({ listEl, sentinelEl, endpoint, params = {}, renderItem }) {
    this.listEl = listEl;
    this.sentinelEl = sentinelEl;
    this.endpoint = endpoint;
    this.params = { ...params };
    this.renderItem = renderItem;
    this.done = false;
    this.loading = false;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.isIntersecting && this.loadMore());
      },
      { rootMargin: "800px 0px" }
    );
  }

  buildURL() {
    if (!this.endpoint || this.endpoint.includes("/undefined")) {
      throw new Error(`잘못된 endpoint: ${this.endpoint}`);
    }
    const url = new URL(this.endpoint, window.location.origin);
    Object.entries(this.params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    return url.toString();
  }

  parsePaging(data) {
    const items = data.items || data.content || [];
    const hasMore = data.hasMore ?? data.last === false;
    const nextPage = (this.params.page ?? 0) + 1;
    return { items, nextCursor: nextPage, hasMore };
  }

  async loadMore() {
    if (this.loading || this.done) return;
    this.loading = true;
    try {
      const data = await fetchJSON(this.buildURL());
      const { items, nextCursor, hasMore } = this.parsePaging(data);
      items.forEach((item) => this.listEl.appendChild(this.renderItem(item)));
      if (!hasMore) {
        this.done = true;
        this.observer.disconnect();
      } else {
        this.params.page = nextCursor;
      }
    } finally {
      this.loading = false;
    }
  }

  start() {
    if (this.sentinelEl) this.observer.observe(this.sentinelEl);
  }
}
