// infinite_scroller.js
import { getUserIdFromUrl } from "./utils.js";
import { renderPostCard } from "./post_renderer.js";
import { getEl, getEls } from "/common/js/utils/dom.js";
import { getJSON } from "/common/js/api.js";

/**
 * 프로필 페이지 무한 스크롤
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

    /**
     * 무한 스크롤 로드
     */
    async function loadNextPage() {
      if (panel.dataset.hasNext !== "true") return;

      const nextPage = Number(panel.dataset.page) + 1;
      panel.setAttribute("aria-busy", "true");
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
        // 목록이 비어있으면 empty-hint 표시
        const listEl = getEl(".post-grid", panel);
        if (listEl.children.length === 0) {
          const emptyHint = getEl(".empty-hint", panel);
          if (emptyHint) {
            emptyHint.classList.remove("hidden");
          }
        }

        panel.setAttribute("aria-busy", "false");
        loadingText.classList.add("hidden");
      }
    }

    // IntersectionObserver 등록
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadNextPage();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
  });
}
