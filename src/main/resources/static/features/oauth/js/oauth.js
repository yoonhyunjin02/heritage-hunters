document.addEventListener("DOMContentLoaded", function () {
  const totalImages = 10;
  const randomIndex = Math.floor(Math.random() * totalImages) + 1;
  const imageUrl = `/images/oauth/auth-bg${randomIndex}.jpg`;

  const bgElement = document.getElementById("auth-bg-image");
  if (bgElement) {
    bgElement.style.backgroundImage = `url('${imageUrl}')`;
  }
});