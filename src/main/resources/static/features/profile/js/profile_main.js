import { initTabs } from "./tabs.js";
import { InfiniteScroller } from "./infiniteScroller.js";
import { renderPostCard } from "./postRenderer.js";
import { initLightbox } from "./lightbox.js";
import { $, $$ } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initLightbox();

  $$(".post-grid[data-infinite]").forEach((list) => {
    const sentinel = list.nextElementSibling;
    const endpoint = sentinel.dataset.endpoint;
    if (endpoint) {
      new InfiniteScroller({
        listEl: list,
        sentinelEl: sentinel,
        endpoint,
        params: { size: 30 },
        renderItem: renderPostCard,
      }).start();
    }
  });
});
