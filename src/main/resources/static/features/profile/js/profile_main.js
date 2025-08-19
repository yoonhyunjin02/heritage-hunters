// profile_main.js
import { initTabs, getActivePanel } from "./tabs.js";
import { InfiniteScroller } from "./infinite_scroller.js";
import { renderPostCard } from "./post_renderer.js";
import { $, $$ } from "./utils.js";
import { initPostModal } from "./profile_post_modal.js";

// 이미 초기화된 패널 추적 (중복 옵저버 방지)
const initializedPanels = new WeakSet();

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initPostModal();

  // 초기 활성 탭
  setupInfiniteScroll(getActivePanel());

  // 탭 전환 시
  document.addEventListener("tabchange", (e) => {
    const { panel } = e.detail || {};
    if (panel) setupInfiniteScroll(panel);
  });
});

/**
 * 패널 내 post-grid에 무한스크롤 적용
 * - 중복 초기화 방지
 * - data-* 기반 설정: data-size, [data-page], [data-has-next], [data-endpoint]
 */
function setupInfiniteScroll(panelEl) {
  if (!(panelEl instanceof Element)) return;
  if (initializedPanels.has(panelEl)) return;

  const lists = $$(".post-grid[data-infinite]", panelEl);
  if (!lists.length) return;

  // 패널 단위 sentinel/페이지 정보를 사용
  const sentinel = panelEl.querySelector("[data-sentinel]");
  const endpoint = sentinel?.dataset?.endpoint || "";
  const sizeAttr = panelEl.querySelector("[data-size]")?.dataset.size;
  const pageAttr = panelEl.querySelector("[data-page]")?.dataset.page;
  const hasNextAttr = panelEl.querySelector("[data-has-next]")?.dataset.hasNext;

  // endpoint 유효성 검증
  let validEndpoint = "";
  try {
    validEndpoint = new URL(endpoint, window.location.origin).toString();
  } catch {
    return; // 잘못된 엔드포인트면 초기화 건너뜀
  }
  const size = Number.isFinite(Number(sizeAttr)) ? Number(sizeAttr) : 9;
  const page = Number.isFinite(Number(pageAttr)) ? Number(pageAttr) : 1;
  const hasNext = String(hasNextAttr) === "true";
  if (!hasNext || !sentinel) return;

  lists.forEach((list) => {
    // 리스트별 스크롤러 생성
    const scroller = new InfiniteScroller({
      listEl: list,
      sentinelEl: sentinel,
      endpoint: validEndpoint,
      params: { size, page },
      renderItem: renderPostCard,
      onLoading: (isLoading) => {
        sentinel.classList.toggle("loading", isLoading);
        sentinel.setAttribute("aria-busy", String(isLoading));
        list.setAttribute("aria-busy", String(isLoading));
      },
      onError: (err) => {
        // 필요 시 패널 별 에러 UI 연결 가능
        console.warn("Infinite scroll error:", err?.message || err);
      },
      rootMargin: "800px 0px",
    });
    scroller.start({ immediate: false });
  });

  initializedPanels.add(panelEl);
}
