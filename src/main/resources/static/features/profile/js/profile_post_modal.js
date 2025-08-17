(function () {
  document.addEventListener("click", async (e) => {
    const card = e.target.closest(".post-card, .js-open-lightbox");
    if (!card) return;

    e.preventDefault();
    const postId = card.dataset.postId;
    if (!postId) return;

    await openPostModal(postId);
  });

  async function openPostModal(postId) {
    // 기존 모달 제거
    document.getElementById("postDetailModal")?.remove();

    try {
      const res = await fetch(`/posts/${postId}/fragment`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error(res.status);

      const html = await res.text();
      document.getElementById("post-modal-root").innerHTML = html;

      const modal = document.getElementById("postDetailModal");
      if (!modal) throw new Error("Modal not found in fragment");

      modal.style.display = "flex";
      modal.classList.add("show");

      // ===== 기존 JS 초기화 재호출 =====
      if (typeof window.initializePostDetail === "function") {
        window.initializePostDetail();
      }
      if (typeof window.initializeRelativeTime === "function") {
        window.initializeRelativeTime();
      }

      // 좋아요 버튼 이벤트 연결
      if (window.likeManager && typeof window.likeManager.initializeLikeButtons === "function") {
        window.likeManager.initializeLikeButtons(true);
      }
    } catch (err) {
      console.error("모달 로딩 실패:", err);
      alert("게시글을 불러오지 못했습니다.");
    }
  }
})();
