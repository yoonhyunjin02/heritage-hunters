import { getEl } from "/common/js/utils/dom.js";
import createModalCore from "./modal_core.js";
import createGallery from "./modal_gallery.js";
import createActions from "./modal_actions.js";
import createEdit from "./modal_edit.js";
import createComments from "./modal_comments.js";

export default function initPostModal() {
  const root = getEl("#post-modal-root");
  const modal = getEl("#postDetailModal");
  const content = getEl(".modal-content", modal);
  const loader = getEl("#modalLoading", modal);

  // 상태 공유
  const state = { root, modal, content, loader, renderDetail };

  const core = createModalCore(state);
  const gallery = createGallery(state);
  const actions = createActions({ ...state, closeModal: core.closeModal });
  const edit = createEdit({ ...state, renderDetail });
  const comments = createComments({ ...state, renderDetail });

  function renderDetail(data) {
    core.clearDetail();
    core.togglePostActions(data.owner);
    modal.dataset.authorId = data.userId;
    core.renderHeader(data);
    getEl("#postContent").textContent = data.content || "";
    getEl("#postLocation").textContent = data.location || "위치 정보 없음";
    gallery.setImages(data.images || []);
    renderStats(data);
    comments.renderComments(data);
    bindDynamicEventListeners(data);
  }

  function renderStats({ viewCount, likeCount, commentCount, liked }) {
    getEl("#viewCount").textContent = viewCount ?? 0;
    getEl("#likeCount").textContent = likeCount ?? 0;
    getEl("#commentCount").textContent = commentCount ?? 0;
    const likeBtn = getEl("#likeBtn");
    likeBtn.classList.toggle("liked", liked);
    likeBtn.setAttribute("aria-pressed", String(liked));
  }

  function bindDynamicEventListeners(data) {
    getEl(".author-display", modal)?.addEventListener("click", () => {
      window.location.href = `/profile/${modal.dataset.authorId}`;
    });
    edit.bindPostEditForm();
    comments.bindCommentForm(data);
  }

  core.bindStaticEventListeners(onThumbClick, core.closeModal);
  getEl("#likeBtn", modal).addEventListener("click", actions.toggleLike);
  getEl('[data-action="delete-post"]', modal)?.addEventListener("click", actions.onDelete);
  getEl(".gallery-nav.prev", modal)?.addEventListener("click", gallery.prevImage);
  getEl(".gallery-nav.next", modal)?.addEventListener("click", gallery.nextImage);

  async function onThumbClick(e) {
    const card = e.target.closest(".post-thumb");
    if (!card?.dataset.postId) return;
    e.preventDefault();
    await core.openModal(modal.dataset.userId || "", card.dataset.postId);
  }
}
