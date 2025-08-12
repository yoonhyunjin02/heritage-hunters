document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const sideNav   = document.getElementById('sideNav');
  if (!navToggle || !sideNav) return;

  // 열고 닫기 + 지도 영역 밀기
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !sideNav.classList.contains('active');
    sideNav.classList.toggle('active', willOpen);
    document.body.classList.toggle('nav-open', willOpen);
    navToggle.setAttribute('aria-expanded', String(willOpen));
  });

  // 바깥 클릭 닫기
  document.addEventListener('click', (e) => {
    if (!sideNav.classList.contains('active')) return;
    if (!sideNav.contains(e.target) && !navToggle.contains(e.target)) {
      sideNav.classList.remove('active');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ESC 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideNav.classList.contains('active')) {
      sideNav.classList.remove('active');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});