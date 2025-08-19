// profile_post_modal.js
import { $, $$, setHidden, fetchJSON, applyImageFallback } from "./utils.js";

/**
 * 게시물 상세 모달 초기화
 * - XSS 방지: innerHTML 최소화, 사용자 데이터는 textContent 사용
 * - a11y: role/aria, 포커스 트랩, Esc 닫기, aria-live
 * - 전역/내부 이벤트 중복 등록 방지
 */
export function initPostModal() {
  const modalRoot = $("#post-modal-root");
  const modal = modalRoot?.querySelector("#postDetailModal");
  if (!modalRoot || !modal) return;
  if (modalRoot.dataset.initialized === "true") return;
  modalRoot.dataset.initialized = "true";

  let lastFocusedEl = null;
  let focusableEls = [];
  let firstFocusableEl, lastFocusableEl;

  // 전역 게시물 썸네일 클릭
  document.addEventListener("click", onThumbnailClick);

  // 모달 내부 액션
  modalRoot.addEventListener("click", onModalAction);

  // 배경 클릭 닫기
  modalRoot.addEventListener("click", (e) => {
    if (e.target === modalRoot) closeModal();
  });

  // 키보드(Esc, Tab)
  modalRoot.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") trapFocus(e);
  });

  function onThumbnailClick(e) {
    const trigger = e.target.closest(".post-card .post-thumb");
    if (!trigger) return;
    e.preventDefault();

    lastFocusedEl = document.activeElement;
    const postId = trigger.dataset.postId;
    if (!postId) return;

    openModal();
    loadPost(postId);
  }

  function onModalAction(e) {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    e.preventDefault();
    switch (action) {
      case "close-post-modal":
        closeModal();
        break;
      case "prev-image":
        showPrevImage();
        break;
      case "next-image":
        showNextImage();
        break;
      case "focus-comment-input":
        modal.querySelector("#commentTextarea")?.focus();
        break;
      case "toggle-post-dropdown":
        console.warn("toggleDropdown not implemented");
        break;
      case "edit-post":
        console.warn("editPost not implemented");
        break;
      case "delete-post":
        console.warn("deletePost not implemented");
        break;
    }
  }

  // ---------- UI 핸들러 ----------

  function openModal() {
    setHidden(modalRoot, false);
    setHidden(modal, false);
    modalRoot.setAttribute("role", "dialog");
    modalRoot.setAttribute("aria-modal", "true");
    modalRoot.setAttribute("aria-labelledby", "modalTitle");
    const descEl = $("#modalDescription", modal) || modal.querySelector(".modal-body");
    if (descEl?.id) modalRoot.setAttribute("aria-describedby", descEl.id);
    document.body.classList.add("modal-open");

    updateFocusableEls();
    firstFocusableEl?.focus();
  }

  function closeModal() {
    setHidden(modalRoot, true);
    setHidden(modal, true);
    document.body.classList.remove("modal-open");
    // 포커스 복귀: 엘리먼트가 여전히 존재하는 경우에만
    if (lastFocusedEl && document.contains(lastFocusedEl)) {
      lastFocusedEl.focus();
    }
  }

  function trapFocus(e) {
    if (!focusableEls.length) return;
    if (e.shiftKey && document.activeElement === firstFocusableEl) {
      e.preventDefault();
      lastFocusableEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusableEl) {
      e.preventDefault();
      firstFocusableEl.focus();
    }
  }

  function updateFocusableEls() {
    focusableEls = Array.from(modalRoot.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])')).filter(
      (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
    );
    firstFocusableEl = focusableEls[0];
    lastFocusableEl = focusableEls[focusableEls.length - 1];
  }

  function showLoading(show) {
    setHidden(modal.querySelector("#modalLoading"), !show);
    setHidden(modal.querySelector(".modal-body"), show);
  }

  // ---------- 데이터 로드 & 렌더 ----------

  async function loadPost(postId) {
    try {
      showLoading(true);
      resetModal();
      const post = await fetchJSON(`${window.location.pathname}/posts/${encodeURIComponent(postId)}`);
      fillModal(post);
      updateFocusableEls();
    } catch (err) {
      console.error("모달 로딩 실패:", err);
      renderError("게시글을 불러오지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      showLoading(false);
    }
  }

  function renderError(message) {
    const body = modal.querySelector(".modal-body");
    body.textContent = message;
  }

  function resetModal() {
    modal.dataset.postId = "";
    modal.querySelector("#authorName").textContent = "";
    modal.querySelector("#postContent").textContent = "";
    modal.querySelector("#viewCount").textContent = "0";
    modal.querySelector("#likeCount").textContent = "0";
    modal.querySelector("#commentCount").textContent = "0";
    modal.querySelector("#postCreatedAt").textContent = "";
    const avatar = modal.querySelector("#authorAvatar");
    if (avatar) {
      avatar.src = "";
      setHidden(avatar, true);
    }
    const mainImage = modal.querySelector("#mainImage");
    if (mainImage) mainImage.src = "";
    const thumbs = modal.querySelector("#thumbContainer");
    if (thumbs) thumbs.innerHTML = "";
    const comments = modal.querySelector("#commentList");
    if (comments) comments.innerHTML = "";
    const gallery = modal.querySelector("#galleryWrapper");
    if (gallery) setHidden(gallery, true);
  }

  function fillModal(post) {
    modal.dataset.postId = post?.id ?? "";
    modal.querySelector("#authorName").textContent = post?.userNickname ?? "";
    modal.querySelector("#postContent").textContent = post?.content ?? "";
    modal.querySelector("#viewCount").textContent = String(post?.viewCount ?? 0);
    modal.querySelector("#likeCount").textContent = String(post?.likeCount ?? 0);
    modal.querySelector("#commentCount").textContent = String(post?.commentCount ?? 0);
    modal.querySelector("#postCreatedAt").textContent = post?.createdAtFormatted ?? "";

    fillAvatar(post?.userProfileImage, post?.userNickname);
    fillGallery(Array.isArray(post?.images) ? post.images : []);
    fillComments(Array.isArray(post?.comments) ? post.comments : []);
  }

  function fillAvatar(src, nickname) {
    const avatar = modal.querySelector("#authorAvatar");
    if (!avatar) return;
    if (src && typeof src === "string") {
      avatar.src = src;
      avatar.alt = typeof nickname === "string" ? nickname : "";
      applyImageFallback(avatar);
      setHidden(avatar, false);
    } else {
      setHidden(avatar, true);
    }
  }

  function fillGallery(images) {
    const wrapper = modal.querySelector("#galleryWrapper");
    const main = modal.querySelector("#mainImage");
    const thumbs = modal.querySelector("#thumbContainer");
    if (!wrapper || !main || !thumbs) return;

    if (images.length === 0) {
      setHidden(wrapper, true);
      return;
    }
    setHidden(wrapper, false);

    main.src = images[0]?.url || "";
    applyImageFallback(main);

    thumbs.innerHTML = "";
    images.forEach((img, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `thumb${idx === 0 ? " active" : ""}`;
      btn.dataset.index = String(idx);
      btn.setAttribute("aria-selected", String(idx === 0));

      const thumbImg = document.createElement("img");
      thumbImg.src = img?.url || "";
      thumbImg.alt = `썸네일 ${idx + 1}`;
      applyImageFallback(thumbImg);

      btn.appendChild(thumbImg);
      btn.addEventListener("click", () => showImageAt(idx, images));
      thumbs.appendChild(btn);
    });
  }

  function fillComments(comments) {
    const list = modal.querySelector("#commentList");
    if (!list) return;
    list.innerHTML = "";

    if (!comments.length) {
      const empty = document.createElement("div");
      empty.className = "no-comments";
      empty.textContent = "아직 댓글이 없습니다. 첫 댓글을 남겨보세요!";
      list.appendChild(empty);
      return;
    }

    comments.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";

      const avatarWrap = document.createElement("div");
      avatarWrap.className = "c-avatar";
      if (c?.userProfileImage) {
        const avatar = document.createElement("img");
        avatar.src = c.userProfileImage;
        avatar.alt = c?.userNickname || "";
        applyImageFallback(avatar);
        avatarWrap.appendChild(avatar);
      } else {
        const fallback = document.createElement("div");
        fallback.className = "avatar-fallback";
        fallback.textContent = (c?.userNickname || "U").charAt(0);
        avatarWrap.appendChild(fallback);
      }

      const body = document.createElement("div");
      body.className = "c-body";

      const head = document.createElement("div");
      head.className = "c-head";
      const name = document.createElement("span");
      name.className = "c-name";
      name.textContent = c?.userNickname || "";
      const time = document.createElement("time");
      time.className = "c-time";
      time.textContent = c?.createdAtFormatted || "";
      head.append(name, time);

      const text = document.createElement("p");
      text.className = "c-text";
      text.textContent = c?.content || "";

      body.append(head, text);
      item.append(avatarWrap, body);
      list.appendChild(item);
    });
  }

  // ---------- 갤러리 컨트롤 ----------

  function showImageAt(index, images) {
    const main = modal.querySelector("#mainImage");
    if (!main || !images[index]) return;
    main.src = images[index].url || "";
    applyImageFallback(main);
    $$("#thumbContainer .thumb", modal).forEach((t, i) => {
      t.classList.toggle("active", i === index);
      t.setAttribute("aria-selected", String(i === index));
    });
  }

  function showPrevImage() {
    const thumbs = $$("#thumbContainer .thumb", modal);
    const activeIdx = thumbs.findIndex((t) => t.classList.contains("active"));
    if (activeIdx > 0) thumbs[activeIdx - 1].click();
  }

  function showNextImage() {
    const thumbs = $$("#thumbContainer .thumb", modal);
    const activeIdx = thumbs.findIndex((t) => t.classList.contains("active"));
    if (activeIdx < thumbs.length - 1) thumbs[activeIdx + 1].click();
  }
}
