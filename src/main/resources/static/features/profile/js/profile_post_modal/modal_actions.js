import { getUserIdFromUrl } from "../utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { postJSON, deleteJSON } from "/common/js/api.js";

export default function createActions(state) {
  const { modal, closeModal } = state;

  async function toggleLike() {
    const btn = getEl("#likeBtn", modal);
    const countEl = getEl("#likeCount", modal);
    const liked = !btn.classList.contains("liked");

    // UI 먼저 반영
    updateLikeUI(liked, countEl);

    try {
      const data = await postJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/like`);
      updateLikeUI(data.liked, countEl, data.likeCount);
    } catch (err) {
      console.error("좋아요 실패:", err);
    }
  }

  function updateLikeUI(liked, targetEl, forcedCount) {
    const btn = getEl("#likeBtn", modal);
    const iconImg = btn.querySelector("img");

    btn.classList.toggle("liked", liked);
    btn.setAttribute("aria-pressed", String(liked));

    // 좋아요 상태에 따라 SVG 교체
    if (iconImg) {
      iconImg.src = liked ? "/images/icons/heart-filled.svg" : "/images/icons/heart-empty.svg";
    }

    // 좋아요 수 갱신
    targetEl.textContent = forcedCount ?? Number(targetEl.textContent) + (liked ? 1 : -1);
  }

  async function onDelete() {
    if (!confirm("정말 게시글을 삭제하시겠습니까?")) return;
    try {
      await deleteJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}`);
      closeModal();
      alert("게시글을 삭제하였습니다.");
      window.location.reload();
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
    }
  }

  return { toggleLike, onDelete };
}
