// profile_main.js
import { initTabs } from "./tabs.js";
import { InfiniteScroller } from "./infinite_scroller.js";
import { renderPostCard } from "./post_renderer.js";
import { $, $$ } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  initTabs();

  $$(".post-grid[data-infinite]").forEach((list) => {
    const sentinel = list.nextElementSibling;

    const endpoint = sentinel?.dataset?.endpoint;

    if (endpoint && !/\/undefined(\/|$)/.test(endpoint)) {
      const pageInput = list.parentElement.querySelector('[id^="current-page-"]');
      const hasNextInput = list.parentElement.querySelector('[id^="has-next-"]');
      const type = list.dataset.infinite; // 'posts' or 'liked'

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
