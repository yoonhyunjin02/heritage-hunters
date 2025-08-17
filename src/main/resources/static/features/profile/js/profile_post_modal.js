// profile_post_modal.js
(function () {
  // 카드 클릭 -> 모달 오픈
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

  async function openPostModal(postId) {
    // 기존 모달 제거
    document.getElementById("postDetailModal")?.remove();

    try {
      const res = await fetch(`/posts/${postId}/fragment`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error(res.status);

      let html = await res.text();

      // script 제거 → 전역 함수 재정의 방지
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      tempDiv.querySelectorAll("script").forEach((s) => s.remove());
      html = tempDiv.innerHTML;

      document.getElementById("post-modal-root").innerHTML = html;

      const modal = document.getElementById("postDetailModal");
      if (!modal) throw new Error("Modal not found in fragment");

      modal.style.display = "flex";
      modal.classList.add("show");
      document.body.classList.add("modal-open");

      // ===== 전역 닫기 함수 무력화 =====
      window.closeModal = () => {};
      window.closePostDetail = () => {};

      // ===== 닫기 버튼/배경 클릭 직접 처리 =====
      modal.querySelector(".modal-close, .btn-close")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeProfilePostModal();
      });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeProfilePostModal();
        }
      });

      // ===== 기존 JS 초기화 =====
      if (typeof window.initializePostDetail === "function") {
        window.initializePostDetail();
      }
      if (typeof window.initializeRelativeTime === "function") {
        window.initializeRelativeTime();
      }
      if (window.likeManager && typeof window.likeManager.initializeLikeButtons === "function") {
        window.likeManager.initializeLikeButtons(true);
      }
    } catch (err) {
      console.error("모달 로딩 실패:", err);
      alert("게시글을 불러오지 못했습니다.");
    }
  }
})();
