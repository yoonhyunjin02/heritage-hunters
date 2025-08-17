document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const root = document.querySelector('.map-root');

  // 안전장치: 필수 요소 없으면 중단
  if (!navToggle || !root) return;

  // 1) 저장된 상태 복원 (true/false 문자열)
  const savedState = localStorage.getItem('sideNavOpen');
  const isOpen = savedState === 'true'; // null이면 기본 false
  root.classList.toggle('nav-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));

  // 2) 햄버거 버튼으로만 토글
  navToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !root.classList.contains('nav-open');
    root.classList.toggle('nav-open', willOpen);
    navToggle.setAttribute('aria-expanded', String(willOpen));
    localStorage.setItem('sideNavOpen', String(willOpen));
  });

  // 3) 접근성 보강: 포커스 표시(옵션)
  navToggle.addEventListener('keydown', (e) => {
    // 스페이스/엔터로도 토글 가능하게
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navToggle.click();
    }
  });
});