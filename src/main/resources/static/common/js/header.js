// 드롭다운 토글
function toggleDropdown(event) {
  event.preventDefault();
  event.stopPropagation();

  const dropdown = event.currentTarget.closest('.user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', function (e) {
  const dropdown = document.querySelector('.user-dropdown.active');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});
