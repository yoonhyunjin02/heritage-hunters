// profile_main.js
import { initTabs } from "./tabs.js";
import { InfiniteScroller } from "./infinite_scroller.js";
import { renderPostCard } from "./post_renderer.js";
import { initLightbox } from "./lightbox.js";
import { $, $$ } from "./utils.js";

function debugProfileRequest(contextLabel, endpoint) {
  // /profile/{id}/... 구조일 경우 id 추출
  let userId;
  try {
    const parts = endpoint?.split("/") || [];
    // parts 예: ["", "profile", "16", "posts"]
    if (parts.length >= 3) {
      userId = parts[2];
    }
  } catch (e) {
    userId = undefined;
  }

  console.group(`📌 [DEBUG] ${contextLabel}`);
  console.log("endpoint:", endpoint);
  console.log("추출된 userId:", userId);
  console.trace("호출 스택");
  console.groupEnd();

  if (!endpoint || !userId || userId === "undefined") {
    console.warn("🚨 endpoint 또는 userId가 비어있습니다. 요청이 잘못 갈 수 있습니다.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initLightbox();

  console.log($$(".post-grid[data-infinite]").length);

  $$(".post-grid[data-infinite]").forEach((list) => {
    const sentinel = list.nextElementSibling;
    console.log("현재 list:", list);
    console.log("잡힌 sentinel:", sentinel);

    const endpoint = sentinel?.dataset?.endpoint;
    debugProfileRequest(`InfiniteScroll(${list.dataset.infinite})`, endpoint);

    if (endpoint && !/\/undefined(\/|$)/.test(endpoint)) {
      const pageInput = list.parentElement.querySelector('[id^="current-page-"]');
      const hasNextInput = list.parentElement.querySelector('[id^="has-next-"]');
      const type = list.dataset.infinite; // 'posts' or 'liked'

      console.log("hasNext:", hasNextInput?.value);
      if (hasNextInput && hasNextInput.value === "false") return;

      new InfiniteScroller({
        listEl: list,
        sentinelEl: sentinel,
        endpoint,
        params: { size: 9, page: parseInt(pageInput?.value || "1", 10) },
        renderItem: renderPostCard,
      }).start();
    }
  });
});

import "./profile_post_modal.js";
