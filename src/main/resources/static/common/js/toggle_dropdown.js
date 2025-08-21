function toggleDropdown(event) {
  event.preventDefault();
  event.stopPropagation();
  const dropdown = event.currentTarget.closest('.user-dropdown');
  if (dropdown) dropdown.classList.toggle('active');
}

document.addEventListener('click', function (e) {
  const dropdown = document.querySelector('.user-dropdown.active');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

function checkLoginForLeaderboard(event) {
  // 로그인 상태 체크 (header에 user-dropdown이 있으면 로그인된 상태)
  const isLoggedIn = document.querySelector('.user-dropdown') !== null;
  
  if (!isLoggedIn) {
    event.preventDefault();
    alert('리더보드는 로그인이 필요한 서비스입니다.');
    window.location.href = '/login';
    return false;
  }
  
  return true;
}