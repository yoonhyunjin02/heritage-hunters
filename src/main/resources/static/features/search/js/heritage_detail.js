// src/main/resources/static/features/search/js/heritage_detail.js

document.addEventListener("DOMContentLoaded", () => {
  // 1) 이미지 클릭 → 라이트박스 모달 오픈
  const thumbImg = document.querySelector(".heritage__summary__info figure img");
  if (thumbImg) {
    thumbImg.style.cursor = "pointer";
    thumbImg.addEventListener("click", () => {
      openLightbox(thumbImg.src, thumbImg.alt);
    });
  }

  // 라이트박스 생성 함수
  function openLightbox(src, alt) {
    // overlay
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.innerHTML = `
      <div class="lightbox-content">
        <img src="${src}" alt="${alt}" />
      </div>
    `;
    document.body.append(overlay);

    overlay.addEventListener("click", () => {
      overlay.remove();
    });
  }

  // 2) 주소 클릭 → 클립보드 복사 & 토스트
  const addrElements = document.querySelectorAll(".heritage__summary__info address");
  addrElements.forEach((addr) => {
    addr.style.cursor = "pointer";
    addr.title = "클릭하여 주소 복사";
    addr.addEventListener("click", () => {
      navigator.clipboard
        .writeText(addr.textContent.trim())
        .then(() => showToast("주소가 복사되었습니다"))
        .catch(() => showToast("복사에 실패했습니다"));
    });
  });

  // 토스트 메시지 함수
  function showToast(message, duration = 2000) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    document.body.append(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  }

  // 3) 본문 길면 “더보기/접기” 버튼
  const contentSection = document.querySelector(".heritage__content");
  if (contentSection) {
    const maxHeight = 300; // px 단위
    if (contentSection.scrollHeight > maxHeight) {
      contentSection.classList.add("collapsed");
      const btn = document.createElement("button");
      btn.className = "content-toggle-btn";
      btn.textContent = "더보기";
      contentSection.after(btn);

      btn.addEventListener("click", () => {
        const expanded = contentSection.classList.toggle("collapsed");
        btn.textContent = expanded ? "더보기" : "접기";
      });
    }
  }
});
