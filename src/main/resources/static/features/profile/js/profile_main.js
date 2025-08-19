// profile_main.js
// ES Module 형태, HTML 리팩터링 버전과 100% 호환

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initInfiniteScroll();
  initPostModal();
});

/** =====================
 *  탭 전환
 *  ===================== */
function initTabs() {
  const tabs = document.querySelectorAll(".profile-tabs .tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("aria-controls");

      // 탭 상태 변경
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", String(isActive));
        t.tabIndex = isActive ? 0 : -1;
      });

      // 패널 표시 전환
      panels.forEach((panel) => {
        panel.hidden = panel.id !== targetId;
      });
    });
  });
}

/** =====================
 *  무한 스크롤
 *  ===================== */
function initInfiniteScroll() {
  document.querySelectorAll("[data-sentinel]").forEach((sentinel) => {
    const panel = sentinel.closest(".tab-panel");
    const endpoint = sentinel.dataset.endpoint;
    const size = Number(panel.dataset.size) || 9;

    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) return;
          if (panel.dataset.hasNext !== "true") return;

          panel.setAttribute("aria-busy", "true");

          const nextPage = Number(panel.dataset.page) + 1;
          try {
            const res = await fetch(`${endpoint}?page=${nextPage}&size=${size}`);
            if (res.ok) {
              const html = await res.text();
              sentinel.insertAdjacentHTML("beforebegin", html);

              // 다음 페이지 반영
              panel.dataset.page = nextPage;
              // 서버에서 hasNext 값을 함께 내려주도록 구성하면 안정적
            }
          } catch (err) {
            console.error("무한 스크롤 로드 실패:", err);
          } finally {
            panel.setAttribute("aria-busy", "false");
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
  });
}

/** =====================
 *  게시물 상세 모달
 *  ===================== */
function initPostModal() {
  const modalRoot = document.getElementById("post-modal-root");
  const modal = document.getElementById("postDetailModal");
  const loadingOverlay = document.getElementById("modalLoading");
  const closeBtn = modal.querySelector('[data-action="close-post-modal"]');

  // 게시물 카드 클릭 → 모달 열기
  document.body.addEventListener("click", (e) => {
    const card = e.target.closest(".post-thumb");
    if (card && card.dataset.postId) {
      e.preventDefault();
      openPostModal(card.dataset.postId);
    }
  });

  // 닫기 버튼
  closeBtn.addEventListener("click", closePostModal);

  // 바깥영역 클릭 닫기
  modalRoot.addEventListener("click", (e) => {
    if (e.target === modalRoot) {
      closePostModal();
    }
  });

  async function openPostModal(postId) {
    modal.dataset.postId = postId;
    modalRoot.hidden = false;
    modal.hidden = false;
    modal.focus();

    loadingOverlay.hidden = false;
    modal.setAttribute("aria-busy", "true");

    try {
      const res = await fetch(`/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        renderPostDetail(data);
      }
    } catch (err) {
      console.error("게시물 로드 실패:", err);
    } finally {
      loadingOverlay.hidden = true;
      modal.setAttribute("aria-busy", "false");
    }
  }

  function closePostModal() {
    modalRoot.hidden = true;
    modal.hidden = true;
    modal.dataset.postId = "";
  }
}

/** =====================
 *  게시물 상세 렌더링
 *  ===================== */
function renderPostDetail(data) {
  // 작성자 정보
  const authorName = document.getElementById("authorName");
  authorName.textContent = data.authorName || "";

  const createdAt = document.getElementById("postCreatedAt");
  createdAt.textContent = data.createdAt || "";

  // 내용
  const contentEl = document.getElementById("postContent");
  contentEl.textContent = data.content || "";

  // 메인 이미지
  const mainImage = document.getElementById("mainImage");
  mainImage.src = data.images?.[0] || mainImage.dataset.fallback;
  mainImage.alt = data.title || "게시글 이미지";

  // 갤러리 썸네일
  const thumbs = document.getElementById("thumbContainer");
  thumbs.innerHTML = "";
  (data.images || []).forEach((img, idx) => {
    const thumb = document.createElement("img");
    thumb.src = img;
    thumb.alt = `${idx + 1}번 이미지`;
    thumb.loading = "lazy";
    thumb.addEventListener("click", () => {
      mainImage.src = img;
      mainImage.alt = `${idx + 1}번 이미지`;
    });
    thumbs.appendChild(thumb);
  });

  // 스탯 반영
  document.getElementById("viewCount").textContent = data.viewCount ?? 0;
  document.getElementById("likeCount").textContent = data.likeCount ?? 0;
  document.getElementById("commentCount").textContent = data.commentCount ?? 0;

  // 좋아요 버튼 상태
  const likeBtn = document.getElementById("likeBtn");
  likeBtn.setAttribute("aria-pressed", String(data.liked === true));
  likeBtn.dataset.postId = data.id;

  // 댓글
  const commentList = document.getElementById("commentList");
  commentList.innerHTML = "";
  (data.comments || []).forEach((c) => {
    const div = document.createElement("div");
    div.className = "comment-item";
    div.textContent = `${c.author}: ${c.text}`;
    commentList.appendChild(div);
  });
}
