// lightbox.js
import { $, setHidden, fetchJSON, replaceId } from "./utils.js";
import { InfiniteScroller } from "./infinite_scroller.js";
import { renderCommentItem } from "./post_renderer.js";

export function initLightbox() {
  const lightbox = $("#post-lightbox");
  const img = $(".lightbox__img", lightbox);
  const nickname = $(".lightbox__nickname", lightbox);
  const commentList = $(".lightbox__comments", lightbox);
  const commentSentinel = $("#comments-sentinel");

  const detailPattern = document.body.dataset.postDetail;

  document.addEventListener("click", async (e) => {
    const target = e.target.closest(".js-open-lightbox");
    if (!target) return;
    e.preventDefault();

    const id = target.dataset.postId;
    const detail = await fetchJSON(replaceId(detailPattern, id));
    img.src = detail.imageUrl || "";
    nickname.textContent = detail.author?.nickname || "";

    commentList.innerHTML = "";
    new InfiniteScroller({
      listEl: commentList,
      sentinelEl: commentSentinel,
      endpoint: replaceId(document.body.dataset.postComments, id),
      params: { size: 20 },
      renderItem: renderCommentItem,
    }).start();

    setHidden(lightbox, false);
  });

  $(".lightbox__close", lightbox).addEventListener("click", () => setHidden(lightbox, true));
}
