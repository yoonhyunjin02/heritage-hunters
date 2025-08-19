// profile_main.js
import { formatRelativeTime } from "/common/js/utils/time_util.js";

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initInfiniteScroll();
  initPostModal();
});

function getUserIdFromUrl() {
  const segments = window.location.pathname.split("/");
  return String(segments[segments.length - 1]);
}

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
    if (e.target === modalRoot) {
      closePostModal();
    }
  });

  async function openPostModal(userId, postId) {
    const isSamePost = String(modal.dataset.postId) === String(postId);

    if (!isSamePost) {
      clearPostDetail();
      loadingOverlay.style.display = "flex";
      modalContent.style.display = "none";
      modal.setAttribute("aria-busy", "true");
    }

    modal.dataset.postId = postId;
    modalRoot.classList.add("show");
    modalRoot.hidden = false;
    modal.hidden = false;
    modal.focus();

    try {
      const res = await fetch(`/profile/${userId}/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        renderPostDetail(data);
        const navWrapper = modal.querySelector(".nav-wrapper");
        if (data.images && data.images.length <= 1) {
          navWrapper.classList.add("hidden");
        } else {
          navWrapper.classList.remove("hidden");
        }
      }
    } catch (err) {
      console.error("게시물 로드 실패:", err);
    } finally {
      loadingOverlay.style.display = "none";
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
    document.getElementById("authorAvatar").src = "";
    document.getElementById("authorName").textContent = "";
    document.getElementById("postCreatedAt").textContent = "";
    document.getElementById("postContent").textContent = "";
    document.getElementById("postLocation").textContent = "";
    document.getElementById("mainImage").src = "";
    document.getElementById("thumbContainer").innerHTML = "";
    document.getElementById("viewCount").textContent = "0";
    document.getElementById("likeCount").textContent = "0";
    document.getElementById("commentCount").textContent = "0";
    document.getElementById("commentList").innerHTML = "";
  }
}

function renderPostDetail(data) {
  document.getElementsByClassName("post-actions").hidden = data.owner ? false : true;

  document.getElementById("authorAvatar").src = data.userProfileImage || document.getElementById("authorAvatar").dataset.fallback;
  document.getElementById("authorName").textContent = data.userNickname || "";

  const created = new Date(data.createdAt);
  const absolute = created.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const relative = formatRelativeTime(created);
  document.getElementById("postCreatedAt").textContent = `${absolute} (${relative})`;

  document.getElementById("postContent").textContent = data.content || "";
  document.getElementById("postLocation").textContent = data.location || "위치 정보 없음";

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

  document.getElementById("viewCount").textContent = data.viewCount ?? 0;
  document.getElementById("likeCount").textContent = data.likeCount ?? 0;
  document.getElementById("commentCount").textContent = data.commentCount ?? 0;

  const likeBtn = document.getElementById("likeBtn");
  likeBtn.setAttribute("aria-pressed", String(data.liked));
  likeBtn.classList.toggle("liked", data.liked === true);

  // 댓글 렌더링
  const commentList = document.getElementById("commentList");
  commentList.innerHTML = "";
  (data.comments || []).forEach((c) => {
    const div = document.createElement("div");
    div.className = "comment-item";

    // 아바타
    const cAvatar = document.createElement("div");
    cAvatar.className = "comment-avatar";
    const defaultAvatar = `/images/profile/profile${(c.userId % 4) + 1}.png`;
    cAvatar.innerHTML = `<img src="${c.userProfileImage || defaultAvatar}" alt="${c.userNickname}">`;
    div.appendChild(cAvatar);

    // 내용
    const cContent = document.createElement("div");
    cContent.className = "comment-content";

    // 상대 시간 적용
    const relativeTime = formatRelativeTime(c.createdAt);

    cContent.innerHTML = `
      <div class="comment-head">
        <span class="comment-name">${c.userNickname}</span>
        <span class="comment-time">${relativeTime}</span>
      </div>
      <p class="comment-text">${c.content}</p>
    `;
    div.appendChild(cContent);

    commentList.appendChild(div);
  });

  // 댓글 작성 영역 글자 수 표시
  const textarea = document.getElementById("commentTextarea");
  textarea.addEventListener("input", (e) => {
    document.getElementById("commentCharCount").textContent = e.target.value.length;
  });
}
