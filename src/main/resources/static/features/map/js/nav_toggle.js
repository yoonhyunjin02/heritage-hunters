document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const root      = document.querySelector('.map-root');
  const sideNav   = document.getElementById('sideNav');
  if (!navToggle || !root || !sideNav) return;

  // 열고 닫기 (map-root를 2열로)
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !root.classList.contains('nav-open');
    root.classList.toggle('nav-open', willOpen);
    navToggle.setAttribute('aria-expanded', String(willOpen));
  });

  // 바깥 클릭 닫기
  document.addEventListener('click', (e) => {
    if (!root.classList.contains('nav-open')) return;
    if (!sideNav.contains(e.target) && !navToggle.contains(e.target)) {
      root.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ESC 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) {
      root.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});
