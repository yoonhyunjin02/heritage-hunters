import { getUserIdFromUrl } from "./utils.js";
import { getEl, getEls } from "/common/js/utils/dom.js";
import { getJSON, postJSON, deleteJSON } from "/common/js/api.js";
import { formatRelativeTime } from "/common/js/utils/time_util.js";

/**
 * 프로필 페이지 게시물 상세 모달 제어 모듈
 */
export default function initPostModal() {
  const root = getEl("#post-modal-root");
  const modal = getEl("#postDetailModal");
  const content = getEl(".modal-content", modal);
  const loader = getEl("#modalLoading", modal);
  const closeBtn = getEl('[data-action="close-post-modal"]', modal);

  document.body.addEventListener("click", onThumbClick);
  closeBtn.addEventListener("click", closeModal);
  root.addEventListener("click", (e) => e.target === root && closeModal());

  getEl("#likeBtn", modal).addEventListener("click", toggleLike);

  async function onThumbClick(e) {
    const card = e.target.closest(".post-thumb");
    if (!card?.dataset.postId) return;
    e.preventDefault();
    await openModal(getUserIdFromUrl(), card.dataset.postId);
  }

  function openModal(userId, postId) {
    modal.dataset.postId = postId;
    showLoader();
    return getJSON(`/profile/${userId}/posts/${postId}`)
      .then((data) => renderDetail(data))
      .catch((e) => console.error("게시물 로드 실패:", e))
      .finally(hideLoader);
  }

  function closeModal() {
    root.classList.remove("show");
    root.hidden = modal.hidden = true;
  }

  async function toggleLike() {
    const btn = getEl("#likeBtn", modal);
    const countEl = getEl("#likeCount", modal);
    const postId = modal.dataset.postId;
    const liked = !btn.classList.contains("liked");

    updateLikeUI(liked, countEl);
    try {
      const data = await postJSON(`/profile/${getUserIdFromUrl()}/posts/${postId}/like`);
      updateLikeUI(data.liked, countEl, data.likeCount);
    } catch (e) {
      console.error("좋아요 실패:", e);
    }
  }

  function updateLikeUI(liked, targetEl, forcedCount) {
    const btn = getEl("#likeBtn", modal);
    btn.classList.toggle("liked", liked);
    btn.setAttribute("aria-pressed", String(liked));
    targetEl.textContent = forcedCount ?? Number(targetEl.textContent) + (liked ? 1 : -1);
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

  function renderDetail(data) {
    clearDetail();
    togglePostActions(data.owner);
    renderHeader(data);
    renderContent(data);
    renderStats(data);
    renderComments(data);
    bindCommentForm(data);
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

  function renderContent({ content, location, images, heritageName }) {
    getEl("#postContent").textContent = content || "";
    getEl("#postLocation").textContent = location || "위치 정보 없음";

    const mainImg = getEl("#mainImage");
    mainImg.src = images?.[0]?.url || mainImg.dataset.fallback;
    mainImg.alt = heritageName || "게시글 이미지";

    const thumbContainer = getEl("#thumbContainer");
    thumbContainer.innerHTML = "";
    images?.forEach((img, i) => {
      const thumb = document.createElement("img");
      thumb.src = img.url;
      thumb.alt = `${i + 1}번 이미지`;
      thumb.loading = "lazy";
      thumb.addEventListener("click", () => {
        mainImg.src = img.url;
        mainImg.alt = `${i + 1}번 이미지`;
      });
      thumbContainer.appendChild(thumb);
    });
  }

  function renderStats({ viewCount, likeCount, commentCount, liked }) {
    getEl("#viewCount").textContent = viewCount ?? 0;
    getEl("#likeCount").textContent = likeCount ?? 0;
    getEl("#commentCount").textContent = commentCount ?? 0;
    const likeBtn = getEl("#likeBtn");
    likeBtn.classList.toggle("liked", liked);
    likeBtn.setAttribute("aria-pressed", String(liked));
  }

  function renderComments({ comments = [] }) {
    const list = getEl("#commentList");
    list.innerHTML = "";
    comments.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `
        <div class="comment-avatar">
          <img src="${c.userProfileImage || `/images/profile/profile${(c.userId % 4) + 1}.png`}" alt="${c.userNickname}">
        </div>
        <div class="comment-content">
          <div class="comment-head">
            <span class="comment-name">${c.userNickname}</span>
            <span class="comment-time">${formatRelativeTime(c.createdAt)}</span>
          </div>
          <p class="comment-text">${c.content}</p>
        </div>`;
      list.appendChild(item);
    });
  }

  function bindCommentForm(data) {
    const form = getEl("#commentForm");
    const ta = getEl("#commentTextarea");
    const countEl = getEl("#commentCharCount");

    ta.value = "";
    countEl.textContent = "0";

    ta.oninput = () => (countEl.textContent = ta.value.length);

    form.onsubmit = async (e) => {
      e.preventDefault();
      const content = ta.value.trim();
      if (!content) return;
      try {
        await postJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/comments`, { content });
        ta.value = "";
        countEl.textContent = "0";
      } catch (e) {
        console.error("댓글 작성 실패:", e);
      }
      try {
        const comments = await getJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/comments`);
        renderDetail({ ...data, comments });
      } catch (e) {
        console.error("댓글 로드 실패:", e);
      }
    };

    getEl('[data-action="delete-post"]', modal)?.addEventListener("click", onDelete);
    // getEl('[data-action="edit-post"]', modal)?.addEventListener("click", () => alert("게시글 수정 기능은 추후 구현 예정"));
  }

  async function onDelete() {
    if (!confirm("정말 게시글을 삭제하시겠습니까?")) return;
    try {
      await deleteJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}`);
      closeModal();
      alert("게시글을 삭제하었습니다.");
      window.location.reload();
    } catch (e) {
      console.error("게시글 삭제 실패:", e);
    }
  }
}
