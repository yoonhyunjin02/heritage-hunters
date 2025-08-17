// profile_post_modal.js
(function () {
  document.addEventListener("click", async (e) => {
    const card = e.target.closest(".post-card, .js-open-lightbox");
    if (!card) return;

    e.preventDefault();
    const postId = card.dataset.postId;
    if (!postId) return;

    await openPostModal(postId);
  });

  function closeProfilePostModal() {
    document.getElementById("postDetailModal")?.remove();
    document.body.classList.remove("modal-open");
  }

  // 빈 모달 + 로딩 스피너 표시
  function showLoadingModal() {
    document.getElementById("postDetailModal")?.remove();
    document.body.classList.add("modal-open");

    const root = document.getElementById("post-modal-root");
    root.innerHTML = `
      <div id="postDetailModal" class="modal show" style="display:flex">
        <div class="modal-content" style="margin:auto; text-align:center; padding:2rem;">
          <div class="loading-spinner">
            <span class="spinner-icon"></span>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById("postDetailModal");
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeProfilePostModal();
    });
  }

  async function openPostModal(postId) {
    // 1) 로딩 모달 먼저 표시
    showLoadingModal();

    // 2) 브라우저가 한 프레임 그릴 기회를 준 뒤 네트워크 시작
    await new Promise(requestAnimationFrame);

    try {
      const res = await fetch(`/posts/${postId}/fragment`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error(res.status);

      let html = await res.text();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      tempDiv.querySelectorAll("script").forEach((s) => s.remove());
      html = tempDiv.innerHTML;

      // 3) 모달 내부 내용 교체
      const modalContent = document.querySelector("#postDetailModal .modal-content");
      if (modalContent) {
        modalContent.innerHTML = html;
      }

      const modal = document.getElementById("postDetailModal");
      if (!modal) throw new Error("Modal not found in fragment");

      // 전역 닫기 함수 무력화
      window.closeModal = () => {};
      window.closePostDetail = () => {};

      modal.querySelector(".modal-close, .btn-close")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeProfilePostModal();
      });

      // 기존 초기화 호출
      if (typeof window.initializePostDetail === "function") window.initializePostDetail();
      if (typeof window.initializeRelativeTime === "function") window.initializeRelativeTime();
      if (window.likeManager?.initializeLikeButtons) window.likeManager.initializeLikeButtons(true);
    } catch (err) {
      console.error("모달 로딩 실패:", err);
      alert("게시글을 불러오지 못했습니다.");
      closeProfilePostModal();
    }
  }
})();
