import { getUserIdFromUrl } from "../utils.js";
import { getEl } from "/common/js/utils/dom.js";
import { postJSON, deleteJSON } from "/common/js/api.js";

export default function createActions(state) {
  const { modal, closeModal } = state;

  async function toggleLike() {
    const btn = getEl("#likeBtn", modal);
    const countEl = getEl("#likeCount", modal);
    const liked = !btn.classList.contains("liked");
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
    btn.classList.toggle("liked", liked);
    btn.setAttribute("aria-pressed", String(liked));
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
