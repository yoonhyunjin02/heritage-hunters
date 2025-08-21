import { getUserIdFromUrl } from "./utils.js";
import { getEl, getEls } from "/common/js/utils/dom.js";
import { getJSON, postJSON, deleteJSON, patchJSON } from "/common/js/api.js";
import { formatRelativeTime } from "/common/js/utils/time_util.js";

export default function initPostModal() {
  const root = getEl("#post-modal-root");
  const modal = getEl("#postDetailModal");
  const content = getEl(".modal-content", modal);
  const loader = getEl("#modalLoading", modal);

  let imageList = [];
  let currentIndex = 0;

  bindStaticEventListeners();

  function bindStaticEventListeners() {
    document.body.addEventListener("click", onThumbClick);
    getEl('[data-action="close-post-modal"]', modal).addEventListener("click", closeModal);
    root.addEventListener("click", (e) => e.target === root && closeModal());
    getEl("#likeBtn", modal).addEventListener("click", toggleLike);
    getEl('[data-action="delete-post"]', modal)?.addEventListener("click", onDelete);

    // 갤러리 prev/next
    getEl(".gallery-nav.prev", modal)?.addEventListener("click", prevImage);
    getEl(".gallery-nav.next", modal)?.addEventListener("click", nextImage);
  }

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
      .then(renderDetail)
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
    modal.dataset.authorId = data.userId;
    renderHeader(data);
    renderContent(data);
    renderStats(data);
    renderComments(data);
    bindDynamicEventListeners(data);
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

  function renderContent({ content, location, images = [] }) {
    getEl("#postContent").textContent = content || "";
    getEl("#postLocation").textContent = location || "위치 정보 없음";
    imageList = images;
    currentIndex = 0;
    updateMainImage();

    const thumbContainer = getEl("#thumbContainer");
    thumbContainer.innerHTML = "";
    images.forEach((img, i) => {
      const thumb = document.createElement("img");
      thumb.src = img.url;
      thumb.alt = `${i + 1}번 이미지`;
      thumb.loading = "lazy";
      thumb.classList.toggle("active", i === currentIndex);
      thumb.addEventListener("click", () => {
        currentIndex = i;
        updateMainImage();
      });
      thumbContainer.appendChild(thumb);
    });
  }

  function updateMainImage() {
    const mainImg = getEl("#mainImage");
    if (!imageList.length) return;
    const img = imageList[currentIndex];
    mainImg.src = img.url;
    mainImg.alt = `${currentIndex + 1}번 이미지`;
    getEls("#thumbContainer img", modal).forEach((thumb, i) => {
      thumb.classList.toggle("active", i === currentIndex);
    });
  }

  function prevImage() {
    if (!imageList.length) return;
    currentIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    updateMainImage();
  }

  function nextImage() {
    if (!imageList.length) return;
    currentIndex = (currentIndex + 1) % imageList.length;
    updateMainImage();
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
        <div class="comment-avatar" data-user-id="${c.userId}">
          <img src="${c.userProfileImage || `/images/profile/profile${(c.userId % 4) + 1}.png`}" alt="${c.userNickname}">
        </div>
        <div class="comment-content">
          <div class="comment-head">
            <span class="comment-name" data-user-id="${c.userId}">${c.userNickname}</span>
            <span class="comment-time">${formatRelativeTime(c.createdAt)}</span>
          </div>
          <p class="comment-text">${c.content}</p>
        </div>`;
      item.querySelectorAll("[data-user-id]").forEach((el) => {
        el.addEventListener("click", () => {
          const uid = el.getAttribute("data-user-id");
          if (uid) window.location.href = `/profile/${uid}`;
        });
      });
      list.appendChild(item);
    });
  }

  function bindDynamicEventListeners(data) {
    // 작성자 클릭
    getEl(".author-display", modal)?.addEventListener("click", () => {
      window.location.href = `/profile/${modal.dataset.authorId}`;
    });

    bindPostEditForm();
    bindCommentForm(data);
  }

  function bindPostEditForm() {
    const postEditForm = getEl("#editPostForm", modal);
    const postContent = getEl("#postContent", modal);
    const postEditTextarea = getEl("textarea", postEditForm);
    const postEditCharCount = getEl("#editPostCharCount", postEditForm);
    const saveBtn = getEl("#savePostBtn", modal);
    const cancelBtn = getEl("#cancelPostEdit", modal);

    postEditCharCount.textContent = "0";
    postEditTextarea.oninput = () => {
      postEditCharCount.textContent = postEditTextarea.value.length;
    };

    // 수정 버튼 클릭 → 수정 폼 표시
    getEl('[data-action="edit-post"]', modal)?.addEventListener("click", () => {
      postEditTextarea.value = postContent.textContent.trim();
      postEditCharCount.textContent = postEditTextarea.value.length;
      postEditForm.classList.remove("hidden");
      postContent.classList.add("hidden");
    });

    // 취소 버튼 클릭 → 수정 폼 숨김
    cancelBtn?.addEventListener("click", () => {
      postEditForm.classList.add("hidden");
      postContent.classList.remove("hidden");
    });

    // 저장 버튼 클릭 → 수정 요청 (중복 방지)
    saveBtn?.addEventListener("click", async () => {
      if (saveBtn.disabled) return;
      const contentVal = postEditTextarea.value.trim();
      if (!contentVal) {
        alert("게시물 내용을 입력해주세요.");
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = "저장 중...";
      try {
        const updated = await patchJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}`, { content: contentVal });
        renderDetail(updated);
        alert("게시물이 수정되었습니다.");
        postEditForm.classList.add("hidden");
        postContent.classList.remove("hidden");
      } catch (err) {
        alert(err.message || "수정 실패");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "저장";
      }
    });
  }

  function bindCommentForm(data) {
    const form = getEl("#commentForm");
    const ta = getEl("#commentTextarea");
    const countEl = getEl("#commentCharCount");
    const submitBtn = form.querySelector('[type="submit"]');

    ta.value = "";
    countEl.textContent = "0";
    ta.oninput = () => (countEl.textContent = ta.value.length);

    ta.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        form.requestSubmit();
      }
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (submitBtn.disabled) return;
      const content = ta.value.trim();
      if (!content) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "등록 중...";
      try {
        await postJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/comments`, { content });
        ta.value = "";
        countEl.textContent = "0";
        const comments = await getJSON(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/comments`);
        renderDetail({ ...data, comments });
      } catch (err) {
        console.error("댓글 작성 실패:", err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "등록";
      }
    };
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
}
