const toastManager = {
  show(message, type = 'info', duration = 3000) {
    if (!message) return;

    const container = document.getElementById('toast-container');
    if (!container) {
      console.error('Toast container not found!');
      return;
    }

    // 1. 토스트 엘리먼트 생성
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type} show`;

    // 아이콘과 텍스트를 포함하는 내부 구조 생성
    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    const icon = iconMap[type] || '📢';

    toastEl.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-text">${message}</span>
      </div>
      <button type="button" class="toast-close">&times;</button>
    `;

    // 2. 컨테이너에 추가
    container.appendChild(toastEl);

    // 3. 닫기 버튼 이벤트 핸들러
    toastEl.querySelector('.toast-close').addEventListener('click', () => {
      this.close(toastEl);
    });

    // 4. 자동 닫기 타이머
    setTimeout(() => {
      this.close(toastEl);
    }, duration);
  },

  close(toastEl) {
    if (!toastEl) return;

    toastEl.classList.remove('show');
    // 애니메이션이 끝난 후 DOM에서 제거
    toastEl.addEventListener('transitionend', () => {
      toastEl.remove();
    });
  },

  init() {
    // 페이지 로드 시 서버에서 전달된 초기 토스트 메시지가 있다면 표시
    if (typeof initialToastMessage !== 'undefined' && initialToastMessage) {
      this.show(initialToastMessage, initialToastType || 'info');
    }
  }
};

// 페이지 로드 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  toastManager.init();
});