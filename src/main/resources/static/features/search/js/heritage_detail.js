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

  const data = window.HERITAGE_DETAIL || {};

  if (!data.id) {
    const $d = document.getElementById("heritage-data");
    if ($d) {
      data.id = Number($d.dataset.id);
      data.name = $d.dataset.name || "";
      data.address = $d.dataset.address || "";
      data.content = $d.dataset.content || "";
    }
  }

  function buildApiUrl() {
    return `/heritage/${id}/ai`; // POST 엔드포인트
  }

  async function fetchAiContent(selector, type, code) {
    const el = document.querySelector(selector);
    const btn = document.querySelector(`.ai-refresh[data-type="${type}"]`);
    const start = new Date().getTime();

    if (el) {
      el.textContent = "정보를 불러오는 중입니다...";
      el.classList.add("skeleton-text");
    }
    if (btn) {
      btn.style.visibility = "hidden";
      btn.style.opacity = "0";
      btn.disabled = true;
    }

    try {
      const payload = {
        type,
        code,
        name: data.name || "",
        address: data.address || "",
        content: data.content || "",
      };
      console.group(`📦 AI 요청 - ${type}`);
      console.log("▶ 페이로드:", payload);
      console.groupEnd();

      const token = document.querySelector('meta[name="_csrf"]').content;
      const header = document.querySelector('meta[name="_csrf_header"]').content;

      const res = await fetch(buildApiUrl(), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [header]: token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      el.textContent = json?.content ?? "응답이 비어 있어요.";
    } catch (e) {
      console.error(e);
      if (el) el.textContent = "AI 응답을 불러오지 못했어요.";
    } finally {
      if (el) el.classList.remove("skeleton-text");
      if (btn) {
        btn.style.visibility = "visible";
        btn.style.opacity = "1";
        btn.disabled = false;
      }
    }
    const end = new Date().getTime();
    console.log(`type: ${type} ⏱ 응답 시간: ${end - start}ms`);
  }

  function buildResetUrl() {
    return `/heritage/${id}/ai/reset`; // POST 엔드포인트
  }

  async function resetAiState(selector, type, code) {
    const el = document.querySelector(selector);
    const btn = document.querySelector(`.ai-refresh[data-type="${type}"]`);
    if (el) {
      el.textContent = "정보를 불러오는 중입니다...";
      el.classList.add("skeleton-text");
    }
    if (btn) {
      btn.style.visibility = "hidden";
      btn.style.opacity = "0";
      btn.disabled = true;
    }
    try {
      const payload = {
        type,
        code,
      };

      console.group(`🧹 AI 상태 초기화 - ${type}`);
      console.log("▶ 페이로드:", payload);
      console.groupEnd();

      const token = document.querySelector('meta[name="_csrf"]').content;
      const header = document.querySelector('meta[name="_csrf_header"]').content;

      const res = await fetch(buildResetUrl(), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [header]: token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`reset HTTP ${res.status}`);
      console.log(`✅ reset 성공 - ${type}`);
    } catch (e) {
      console.warn("⚠️ reset 실패(계속 진행):", e.message);
    }
  }

  // 로테이션용 client code 계산 (1 ~ 3)
  const clientCode = (id % 3) + 1;

  // 타입 → 타겟 span 선택자 맵
  const selectorMap = {
    recommends: ".heritage__summary__ai__recommends span",
    weather: ".heritage__summary__ai__weather span",
    news: ".heritage__summary__ai__news span",
    summary: ".heritage__summary__ai__content-summary span",
  };

  // 초기 로드
  fetchAiContent(selectorMap.recommends, "recommends", 1);
  fetchAiContent(selectorMap.weather, "weather", 2);
  fetchAiContent(selectorMap.news, "news", 3);
  fetchAiContent(selectorMap.summary, "summary", clientCode);

  // 새로고침 버튼 핸들러
  document.querySelectorAll(".ai-refresh").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const type = btn.dataset.type;
      if (!type || !selectorMap[type]) return;

      // code가 지정된 버튼은 그 값 사용, 아니면 요약 규칙(로테이션)
      const code = btn.dataset.code ? Number(btn.dataset.code) : clientCode;

      // 1) reset 호출 (버튼 상태는 fetchAiContent에서 처리)
      await resetAiState(selectorMap[type], type, code);

      // 2) 실제 AI 요청
      await fetchAiContent(selectorMap[type], type, code);
    });
  });
});
