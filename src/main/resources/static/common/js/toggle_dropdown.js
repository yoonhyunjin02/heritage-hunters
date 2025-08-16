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