import { getUserIdFromUrl } from "../utils.js";
import { getEl, getEls } from "/common/js/utils/dom.js";
import { getJSON } from "/common/js/api.js";
import { formatRelativeTime } from "/common/js/utils/time_util.js";

export default function createModalCore(state) {
  const { root, modal, content, loader, renderDetail } = state;

  function bindStaticEventListeners(onThumbClick, onClose) {
    document.body.addEventListener("click", onThumbClick);
    getEl('[data-action="close-post-modal"]', modal).addEventListener("click", onClose);
    root.addEventListener("click", (e) => e.target === root && onClose());
  }

  async function openModal(userId, postId) {
    modal.dataset.postId = postId;
    showLoader();
    try {
      const data = await getJSON(`/profile/${getUserIdFromUrl()}/posts/${postId}`);
      renderDetail(data);
    } catch (err) {
      console.error("게시물 로드 실패:", err);
    } finally {
      hideLoader();
    }
  }

  function closeModal() {
    root.classList.remove("show");
    root.hidden = modal.hidden = true;
  }

  function showLoader() {
    root.classList.add("show");
    root.hidden = modal.hidden = false;
    loader.classList.remove("hidden");
    content.classList.add("hidden");
    modal.setAttribute("aria-busy", "true");
  }

  function hideLoader() {
    loader.classList.add("hidden");
    content.classList.remove("hidden");
    modal.setAttribute("aria-busy", "false");
  }

  function clearDetail() {
    [
      "authorAvatar",
      "authorName",
      "postCreatedAt",
      "postContent",
      "postLocation",
      "mainImage",
      "thumbContainer",
      "viewCount",
      "likeCount",
      "commentCount",
      "commentList",
    ].forEach((id) => {
      const el = getEl(`#${id}`);
      if (!el) return;
      if (el.tagName === "IMG") el.src = el.dataset.fallback || "";
      else el.textContent = "";
      if (["thumbContainer", "commentList"].includes(id)) el.innerHTML = "";
    });
  }

  function togglePostActions(show) {
    getEl(".post-actions", modal).hidden = !show;
  }

  function renderHeader({ userProfileImage, userNickname, createdAt }) {
    getEl("#authorAvatar").src = userProfileImage || getEl("#authorAvatar").dataset.fallback;
    getEl("#authorName").textContent = userNickname;
    const date = new Date(createdAt);
    getEl("#postCreatedAt").textContent = `${date.toLocaleDateString("ko-KR")} (${formatRelativeTime(date)})`;
  }

  return {
    bindStaticEventListeners,
    openModal,
    closeModal,
    clearDetail,
    togglePostActions,
    renderHeader,
  };
}
