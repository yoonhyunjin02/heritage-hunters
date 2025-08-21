// profile_main.js
import { formatRelativeTime } from "/common/js/utils/time_util.js";

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initInfiniteScroll();
  initPostModal();
  initProfileEdit();
});

function getUserIdFromUrl() {
  const segments = window.location.pathname.split("/");
  return String(segments[segments.length - 1]);
}

function getCsrfHeaders() {
  const token = document.querySelector("meta[name='_csrf']").content;
  const header = document.querySelector("meta[name='_csrf_header']").content;
  return { [header]: token };
}

// ==========================
// 1. 탭 처리
// ==========================
function initTabs() {
  const tabs = document.querySelectorAll(".profile-tabs .tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("aria-controls");

      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", String(isActive));
        t.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        panel.hidden = panel.id !== targetId;
      });
    });
  });
}

// ==========================
// 2. 무한 스크롤
// ==========================
function initInfiniteScroll() {
  const userId = getUserIdFromUrl();

  document.querySelectorAll("[data-sentinel]").forEach((sentinel) => {
    const panel = sentinel.closest(".tab-panel");
    let endpoint = sentinel.dataset.endpoint;
    const size = Number(panel.dataset.size) || 9;

    if (!endpoint.startsWith(`/profile/`)) {
      endpoint = `/profile/${userId}${endpoint}`;
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) return;
          if (panel.dataset.hasNext !== "true") return;

          panel.setAttribute("aria-busy", "true");
          const nextPage = Number(panel.dataset.page) + 1;
          const loadingEl = sentinel.querySelector(".infinite-sentinel__loading");

          try {
            loadingEl.style.display = "flex";
            const res = await fetch(`${endpoint}?page=${nextPage}&size=${size}`);
            if (!res.ok) throw new Error(res.statusText);

            const pageData = await res.json();
            const listEl = panel.querySelector(".post-grid");

            pageData.content.forEach((post) => {
              listEl.appendChild(renderPostCard(post));
            });

            panel.dataset.page = nextPage;
            panel.dataset.hasNext = String(!pageData.last);
          } catch (err) {
            console.error("무한 스크롤 로드 실패:", err);
          } finally {
            panel.setAttribute("aria-busy", "false");
            loadingEl.style.display = "none";
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
  });
}

function renderPostCard(post) {
  const li = document.createElement("li");
  li.className = "post-card";

  const a = document.createElement("a");
  a.href = "#";
  a.className = "post-thumb";
  a.dataset.postId = post.id;
  a.setAttribute("aria-label", `${post.heritage?.name ?? "게시물"} 상세 보기`);

  const img = document.createElement("img");
  img.className = "post-thumb__img";
  img.src = post.mainImageUrl || "/images/placeholders/no-image.png";
  img.alt = post.heritage?.name ?? "게시물 이미지";
  img.loading = "lazy";
  img.dataset.fallback = "/images/placeholders/no-image.png";

  const overlay = document.createElement("div");
  overlay.className = "post-thumb__overlay";
  overlay.innerHTML = `
    <span class="overlay-item"><span aria-hidden="true">♥</span> ${post.likeCount ?? 0}</span>
    <span class="overlay-item"><span aria-hidden="true">💬</span> ${post.commentCount ?? 0}</span>
  `;

  a.append(img, overlay);
  li.appendChild(a);
  return li;
}

// ==========================
// 3. 게시글 모달 + 상세
// ==========================
function initPostModal() {
  const modalRoot = document.getElementById("post-modal-root");
  const modal = document.getElementById("postDetailModal");
  const modalContent = modal.querySelector(".modal-content");
  const loadingOverlay = document.getElementById("modalLoading");
  const closeBtn = modal.querySelector('[data-action="close-post-modal"]');

  document.body.addEventListener("click", (e) => {
    const card = e.target.closest(".post-thumb");
    if (card && card.dataset.postId) {
      e.preventDefault();
      openPostModal(getUserIdFromUrl(), String(card.dataset.postId));
    }
  });

  closeBtn.addEventListener("click", closePostModal);

  modalRoot.addEventListener("click", (e) => {
    if (e.target === modalRoot) closePostModal();
  });

  // ==========================
  // 좋아요 토글
  // ==========================
  modal.querySelector("#likeBtn").addEventListener("click", async () => {
    const likeBtn = modal.querySelector("#likeBtn");
    const postId = modal.dataset.postId;
    if (!postId) return;

    // UI 즉시 변경
    const liked = !likeBtn.classList.contains("liked");
    likeBtn.classList.toggle("liked", liked);
    likeBtn.setAttribute("aria-pressed", String(liked));
    const countEl = modal.querySelector("#likeCount");
    countEl.textContent = Number(countEl.textContent) + (liked ? 1 : -1);

    try {
      const res = await fetch(`/profile/${getUserIdFromUrl()}/posts/${postId}/like`, {
        method: "POST",
        headers: getCsrfHeaders(),
      });
      if (!res.ok) throw new Error(res.statusText);

      const data = await res.json();
      countEl.textContent = data.likeCount;
      likeBtn.setAttribute("aria-pressed", String(data.liked));
      likeBtn.classList.toggle("liked", data.liked);
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
    }
  });

  async function openPostModal(userId, postId) {
    const isSamePost = String(modal.dataset.postId) === String(postId);

    if (!isSamePost) clearPostDetail();

    modal.dataset.postId = postId;
    modalRoot.classList.add("show");
    modalRoot.hidden = false;
    modal.hidden = false;
    modal.focus();

    loadingOverlay.hidden = false;
    modalContent.style.display = "none";
    modal.setAttribute("aria-busy", "true");

    try {
      const res = await fetch(`/profile/${userId}/posts/${postId}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      renderPostDetail(data);
      modal.querySelector(".nav-wrapper").classList.toggle("hidden", (data.images?.length || 0) <= 1);
    } catch (err) {
      console.error("게시물 로드 실패:", err);
    } finally {
      loadingOverlay.hidden = true;
      modalContent.style.display = "flex";
      modal.setAttribute("aria-busy", "false");
    }
  }

  function closePostModal() {
    modalRoot.classList.remove("show");
    modalRoot.hidden = true;
    modal.hidden = true;
  }

  function clearPostDetail() {
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
      const el = document.getElementById(id);
      if (el) el.textContent = "";
      if (el?.tagName === "IMG") el.src = el.dataset.fallback || "";
      if (id === "thumbContainer" || id === "commentList") el.innerHTML = "";
    });
  }

  function renderPostDetail(data) {
    // 게시글 수정/삭제 버튼
    const postActions = modal.querySelector(".post-actions");
    postActions.hidden = !data.owner;

    // 작성자
    const authorAvatar = document.getElementById("authorAvatar");
    authorAvatar.src = data.userProfileImage || authorAvatar.dataset.fallback;
    document.getElementById("authorName").textContent = data.userNickname || "";
    const created = new Date(data.createdAt);
    const absolute = created.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
    document.getElementById("postCreatedAt").textContent = `${absolute} (${formatRelativeTime(created)})`;

    // 내용
    document.getElementById("postContent").textContent = data.content || "";
    document.getElementById("postLocation").textContent = data.location || "위치 정보 없음";

    // 이미지
    const mainImage = document.getElementById("mainImage");
    mainImage.src = data.images?.[0]?.url || mainImage.dataset.fallback;
    mainImage.alt = data.heritageName || "게시글 이미지";

    const thumbs = document.getElementById("thumbContainer");
    thumbs.innerHTML = "";
    (data.images || []).forEach((img, idx) => {
      const thumb = document.createElement("img");
      thumb.src = img.url;
      thumb.alt = `${idx + 1}번 이미지`;
      thumb.loading = "lazy";
      thumb.addEventListener("click", () => {
        mainImage.src = img.url;
        mainImage.alt = `${idx + 1}번 이미지`;
      });
      thumbs.appendChild(thumb);
    });

    // 통계
    document.getElementById("viewCount").textContent = data.viewCount ?? 0;
    document.getElementById("likeCount").textContent = data.likeCount ?? 0;
    document.getElementById("commentCount").textContent = data.commentCount ?? 0;

    // 좋아요
    const likeBtn = document.getElementById("likeBtn");
    likeBtn.setAttribute("aria-pressed", String(data.liked));
    likeBtn.classList.toggle("liked", data.liked);

    // 댓글
    const commentList = document.getElementById("commentList");
    commentList.innerHTML = "";
    (data.comments || []).forEach((c) => {
      const div = document.createElement("div");
      div.className = "comment-item";

      const cAvatar = document.createElement("div");
      cAvatar.className = "comment-avatar";
      const defaultAvatar = `/images/profile/profile${(c.userId % 4) + 1}.png`;
      cAvatar.innerHTML = `<img src="${c.userProfileImage || defaultAvatar}" alt="${c.userNickname}">`;
      div.appendChild(cAvatar);

      const cContent = document.createElement("div");
      cContent.className = "comment-content";
      cContent.innerHTML = `
        <div class="comment-head">
          <span class="comment-name">${c.userNickname}</span>
          <span class="comment-time">${formatRelativeTime(c.createdAt)}</span>
        </div>
        <p class="comment-text">${c.content}</p>
      `;
      div.appendChild(cContent);

      commentList.appendChild(div);
    });

    // 댓글 작성
    const commentForm = document.getElementById("commentForm");
    const textarea = document.getElementById("commentTextarea");
    textarea.value = "";
    document.getElementById("commentCharCount").textContent = "0";

    commentForm.onsubmit = async (e) => {
      e.preventDefault();
      const content = textarea.value.trim();
      if (!content) return;

      try {
        const res = await fetch(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(res.statusText);
        const comments = await res.json();
        renderPostDetail({ ...data, comments });
        textarea.value = "";
        document.getElementById("commentCharCount").textContent = "0";
      } catch (err) {
        console.error("댓글 작성 실패:", err);
      }
    };

    textarea.oninput = (e) => {
      document.getElementById("commentCharCount").textContent = e.target.value.length;
    };

    // 수정 / 삭제 버튼
    postActions.querySelector('[data-action="delete-post"]')?.addEventListener("click", async () => {
      if (!confirm("정말 게시글을 삭제하시겠습니까?")) return;
      try {
        const res = await fetch(`/profile/${getUserIdFromUrl()}/posts/${modal.dataset.postId}`, {
          method: "DELETE",
          headers: getCsrfHeaders(),
        });
        if (!res.ok) throw new Error(res.statusText);
        closePostModal();
        window.location.reload();
      } catch (err) {
        console.error("게시글 삭제 실패:", err);
      }
    });

    postActions.querySelector('[data-action="edit-post"]')?.addEventListener("click", () => {
      // 추후 모달 내 편집 폼 구현
      alert("게시글 수정 기능은 추후 구현 예정");
    });
  }
}

// ==========================
// 4. 프로필 수정
// ==========================
function initProfileEdit() {
  const editBtn = document.getElementById("editProfileBtn");
  if (!editBtn) return;

  editBtn.addEventListener("click", () => {
    const form = document.getElementById("profileEditForm");
    if (!form) return;
    form.classList.toggle("hidden");
  });

  const form = document.getElementById("profileEditForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/profile/${getUserIdFromUrl()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      alert("프로필이 수정되었습니다.");
      window.location.reload();
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      alert("프로필 수정 실패");
    }
  });
}
