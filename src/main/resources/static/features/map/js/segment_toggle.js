// 타입 변경
function setType(type) {
  // map.js에서 쓰는 전역 상태와 호환
  window.currentType = type;

  document.querySelectorAll('#typeSegment .seg-btn')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === type)));

  // 타입 변경 시 동일 뷰포트라도 재조회
  window.lastBboxKey = '';
  // fetchByViewport는 map.js에 있음. 안전 호출
  if (typeof window.fetchByViewport === 'function') {
    window.fetchByViewport();
  }
}

// 세그먼트 이벤트 바인딩
function wireTypeSegment() {
  const seg = document.getElementById('typeSegment');
  if (!seg) return;

  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    if (btn.getAttribute('aria-pressed') === 'true') return;
    setType(btn.dataset.type);
  });
}

// 전역에서 접근 가능하도록 노출
window.setType = setType;
window.wireTypeSegment = wireTypeSegment;
