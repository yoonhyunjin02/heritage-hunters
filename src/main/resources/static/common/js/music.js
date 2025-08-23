document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("bgm");
  const toggleBtn = document.getElementById("bgm-toggle");
  if (!audio || !toggleBtn) return;

  const iconImg = toggleBtn.querySelector("img.icon");
  const ICON_ON  = toggleBtn.dataset.iconOn  || "/images/icons/music.svg";
  const ICON_OFF = toggleBtn.dataset.iconOff || "/images/icons/mute.svg";

  const path = window.location.pathname;
  const isAuthPage = path.includes("/login") || path.includes("/register");

  // 저장값
  const savedTime   = localStorage.getItem("bgm-time");
  const wasPlaying  = localStorage.getItem("bgm-playing") === "true";
  if (savedTime) audio.currentTime = parseFloat(savedTime);

  // 아이콘 동기화 함수
  function syncIcon() {
    if (!iconImg) return;
    if (audio.paused) {
      iconImg.src = ICON_OFF;
      iconImg.alt = "음악 꺼짐";
    } else {
      iconImg.src = ICON_ON;
      iconImg.alt = "음악 켜짐";
    }
  }

  // 초기 재생 상태 복원 (로그인/회원가입 페이지는 강제 정지)
  if (!isAuthPage && wasPlaying) {
    audio.play().catch(() => {
      // 자동재생 차단 시 실제 상태는 pause이므로 아이콘만 OFF로 맞춤
      localStorage.setItem("bgm-playing", "false");
      audio.pause();
      syncIcon();
    });
  } else {
    audio.pause();
  }
  syncIcon();

  // 버튼 클릭 토글
  toggleBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => {
        localStorage.setItem("bgm-playing", "true");
        syncIcon();
      }).catch(() => {/* 무시 */});
    } else {
      audio.pause();
      localStorage.setItem("bgm-playing", "false");
      syncIcon();
    }
  });

  // 재생 상태 변화 이벤트에도 아이콘 동기화
  audio.addEventListener("play",  syncIcon);
  audio.addEventListener("pause", syncIcon);
  audio.addEventListener("ended", syncIcon);

  // 현재 위치 저장 (1초마다)
  setInterval(() => {
    localStorage.setItem("bgm-time", audio.currentTime);
  }, 1000);
});