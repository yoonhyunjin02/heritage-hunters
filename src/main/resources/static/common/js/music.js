// music.js
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("bgm");
  const toggleBtn = document.getElementById("bgm-toggle");

  const path = window.location.pathname;
  const isAuthPage = path.includes("/login") || path.includes("/register");

  // 로컬 저장된 값 불러오기
  const savedTime = localStorage.getItem("bgm-time");
  const wasPlaying = localStorage.getItem("bgm-playing") === "true";

  if (savedTime) {
    audio.currentTime = parseFloat(savedTime);
  }

  // 로그인/회원가입 제외, 이전에 재생 중이었다면 이어서 시도
  if (!isAuthPage && wasPlaying) {
    audio.play().catch(() => {
      // 브라우저 정책으로 자동재생 막히면 버튼 클릭 시 시작됨
      console.log("Autoplay blocked. Waiting for user interaction.");
    });
  } else {
    audio.pause();
  }

  // 버튼 클릭으로 재생/정지 토글
  toggleBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      localStorage.setItem("bgm-playing", "true");
    } else {
      audio.pause();
      localStorage.setItem("bgm-playing", "false");
    }
  });

  // 1초마다 현재 시간 저장
  setInterval(() => {
    localStorage.setItem("bgm-time", audio.currentTime);
  }, 1000);
});