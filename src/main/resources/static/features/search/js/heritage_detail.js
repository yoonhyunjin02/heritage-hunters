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

  function openLightbox(src, alt) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.innerHTML = `<div class="lightbox-content"><img src="${src}" alt="${alt}" /></div>`;
    document.body.append(overlay);
    overlay.addEventListener("click", () => overlay.remove());
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
    const maxHeight = 300;
    if (contentSection.scrollHeight > maxHeight) {
      contentSection.classList.add("collapsed");
      const btn = document.createElement("button");
      btn.className = "content-toggle-btn";
      btn.textContent = "더보기";
      contentSection.after(btn);

      btn.addEventListener("click", () => {
        const collapsed = contentSection.classList.toggle("collapsed");
        btn.textContent = collapsed ? "더보기" : "접기";
      });
    }
  }

  // Heritage ID 추출
  const id = Number(window.location.pathname.split("/").pop());

  // AI 요청용 공통 URL 생성
  function buildApiUrl(type, code) {
    const url = new URL(`/heritage/${id}/ai`, window.location.origin);
    url.searchParams.set("type", type);
    if (code) url.searchParams.set("code", String(code));
    return url.toString();
  }

  // AI 응답 가져오기 함수
  async function fetchAiContent(selector, type, code) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.textContent = "정보를 불러오는 중입니다...";
    try {
      const res = await fetch(buildApiUrl(type, code), { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      el.textContent = data?.content ?? "응답이 비어 있어요.";
    } catch (e) {
      console.error(e);
      el.textContent = "AI 응답을 불러오지 못했어요.";
    }
  }

  // 로테이션용 client code 계산 (1 ~ 3)
  const clientCode = (id % 3) + 1;

  // AI 콘텐츠 요청
  fetchAiContent(".heritage__summary__ai__recommends span", "recommends", 1);
  fetchAiContent(".heritage__summary__ai__weather span", "weather", 2);
  fetchAiContent(".heritage__summary__ai__news span", "news", 3);
  fetchAiContent(".heritage__summary__ai__content-summary span", "summary", clientCode);
});
