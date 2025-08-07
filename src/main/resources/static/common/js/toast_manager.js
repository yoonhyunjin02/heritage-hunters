const toastManager = {
  init() {
    const toastEl = document.getElementById('toast-message');
    if (!toastEl) {
      return;
    }

    // 토스트 자동 닫기 (3초 후)
    this.timeout = setTimeout(() => {
      this.close();
    }, 3000);

    // 클래스 추가로 애니메이션 효과 줄 수 있음
    toastEl.classList.add('show');
  },

  close() {
    const toastEl = document.getElementById('toast-message');
    if (!toastEl) {
      return;
    }

    toastEl.classList.remove('show'); // 애니메이션 닫기 효과
    toastEl.remove(); // DOM에서 제거
    clearTimeout(this.timeout);
  }
};

// 페이지 로드 후 토스트가 있다면 표시
document.addEventListener("DOMContentLoaded", () => {
  toastManager.init();
});