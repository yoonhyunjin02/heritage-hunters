import { getEl, getEls } from "/common/js/utils/dom.js";

export default function createGallery(state) {
  const { modal } = state;
  let imageList = [],
    currentIndex = 0;

  function setImages(images = []) {
    imageList = images;
    currentIndex = 0;
    updateMainImage();
    const thumbContainer = getEl("#thumbContainer");
    thumbContainer.innerHTML = "";
    images.forEach((img, i) => {
      const thumb = document.createElement("img");
      thumb.src = img.url;
      thumb.alt = `${i + 1}번 이미지`;
      thumb.loading = "lazy";
      thumb.classList.toggle("active", i === currentIndex);
      thumb.addEventListener("click", () => {
        currentIndex = i;
        updateMainImage();
      });
      thumbContainer.appendChild(thumb);
    });
  }

  function updateMainImage() {
    if (!imageList.length) return;
    const mainImg = getEl("#mainImage");
    const img = imageList[currentIndex];
    mainImg.src = img.url;
    mainImg.alt = `${currentIndex + 1}번 이미지`;
    getEls("#thumbContainer img", modal).forEach((thumb, i) => {
      thumb.classList.toggle("active", i === currentIndex);
    });
  }

  function prevImage() {
    if (!imageList.length) return;
    currentIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    updateMainImage();
  }

  function nextImage() {
    if (!imageList.length) return;
    currentIndex = (currentIndex + 1) % imageList.length;
    updateMainImage();
  }

  return { setImages, prevImage, nextImage };
}
