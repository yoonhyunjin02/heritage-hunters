document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img').forEach(img => {
    img.onerror = () => {
      // 무한 루프 방지: fallback 이미지도 로드 실패하면 다시 onerror 호출될 수 있음
      if (!img.dataset.fallbackApplied) {
        img.src = '/images/placeholders/no-image.png'; // 기본 이미지 경로
        img.dataset.fallbackApplied = 'true';
      }
    };
  });
});