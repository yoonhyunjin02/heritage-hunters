// 타입 변경
function setType(type) {
  // map.js에서 쓰는 전역 상태와 호환
  window.currentType = type;

  document.querySelectorAll('#typeSegment .seg-btn')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === type)));

  // 타입 변경 시 동일 뷰포트라도 재조회
  window.lastBboxKey = '';

  // 검색어가 있으면 검색 우선 (뷰포트 호출 막음)
  const q = document.getElementById('search');
  if (q && q.value.trim()) {
    if (typeof window.__forceSearchRefresh === 'function') {
      window.__forceSearchRefresh();
    }
    return; // 여기서 종료하므로 fetchByViewport() 안 감
  }

  // 검색이 아니면 뷰포트 재조회
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
    setType(btn.dataset.type); // ← setType 내부에서 검색/뷰포트 분기 처리
  });
}

// 전역에서 접근 가능하도록 노출
window.setType = setType;
window.wireTypeSegment = wireTypeSegment;