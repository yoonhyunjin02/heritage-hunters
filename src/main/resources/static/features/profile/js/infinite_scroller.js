import { getUserIdFromUrl } from "./utils.js";
import { renderPostCard } from "./post_renderer.js";
import { getEl, getEls } from "/common/js/utils/dom.js";
import { getJSON } from "/common/js/api.js";

/**
 * 프로필 페이지 무한 스크롤 초기화
 */
export default function initInfiniteScroll() {
  const userId = getUserIdFromUrl();

  getEls("[data-sentinel]").forEach((sentinel) => {
    const panel = sentinel.closest(".tab-panel");
    let endpoint = sentinel.dataset.endpoint;
    const loadingText = getEl(".infinite-sentinel__loading", sentinel);
    const size = Number(panel.dataset.size) || 9;

    if (!endpoint.startsWith("/profile/")) {
      endpoint = `/profile/${userId}${endpoint}`;
    }

    const observer = new IntersectionObserver(onIntersect, { threshold: 0.1 });
    observer.observe(sentinel);

    async function onIntersect(entries) {
      for (const entry of entries) {
        if (!entry.isIntersecting || panel.dataset.hasNext !== "true") return;

        panel.setAttribute("aria-busy", "true");
        const nextPage = Number(panel.dataset.page) + 1;
        loadingText.classList.remove("hidden");

        try {
          const data = await getJSON(`${endpoint}?page=${nextPage}&size=${size}`);
          const listEl = getEl(".post-grid", panel);
          data.content.forEach((post) => listEl.appendChild(renderPostCard(post)));
          panel.dataset.page = nextPage;
          panel.dataset.hasNext = String(!data.last);
        } catch (e) {
          console.error("무한 스크롤 오류:", e);
        } finally {
          panel.setAttribute("aria-busy", "false");
          loadingText.classList.add("hidden");
        }
      }
    }
  });
}
