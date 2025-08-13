// 게시글 수정 모듈 (필요 부분만 발췌/정리)
(function () {
  const $ = (id) => document.getElementById(id);

  // 이미지 갤러리 상태
  let images = [];
  let current = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initializeImageGallery();
  });

  function initializeImageGallery() {
    const thumbs = document.querySelectorAll('.thumb img');
    const main = document.getElementById('mainImage');

    if (thumbs.length) {
      images = Array.from(thumbs).map((img, i) => ({
        url: img.src,
        alt: img.alt || `이미지 ${i + 1}`
      }));
    } else if (main?.src) {
      images = [{url: main.src, alt: '이미지 1'}];
    } else {
      images = [];
    }
    current = 0;
    updateGallery();
    bindGalleryEvents();
  }

  function bindGalleryEvents() {
    // 썸네일 클릭 이벤트
    document.querySelectorAll('.thumb').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.index);
        if (!isNaN(index)) {
          showImage(index);
        }
      });
    });

    // 화살표 버튼 이벤트
    document.querySelector('.gallery-nav.prev')?.addEventListener('click', (e) => {
      e.preventDefault();
      prevImage();
    });
    document.querySelector('.gallery-nav.next')?.addEventListener('click', (e) => {
      e.preventDefault();
      nextImage();
    });
  }

  function updateGallery() {
    const main = document.getElementById('mainImage');
    if (main && images[current]) {
      main.style.opacity = '0.5';
      setTimeout(() => {
        main.src = images[current].url;
        main.alt = images[current].alt;
        main.style.opacity = '1';
      }, 120);
    }
    
    // 썸네일 활성화 상태 업데이트
    document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === current));
    
    // 화살표 버튼 표시/숨김
    const prev = document.querySelector('.gallery-nav.prev');
    const next = document.querySelector('.gallery-nav.next');
    if (prev && next) {
      const multi = images.length > 1;
      prev.style.display = multi ? 'flex' : 'none';
      next.style.display = multi ? 'flex' : 'none';
    }
  }

  function prevImage() {
    if (images.length > 1) {
      current = (current - 1 + images.length) % images.length;
      updateGallery();
    }
  }

  function nextImage() {
    if (images.length > 1) {
      current = (current + 1) % images.length;
      updateGallery();
    }
  }

  function showImage(i) {
    if (i >= 0 && i < images.length) {
      current = i;
      updateGallery();
    }
  }

  // 필요한 최소 전역만 유지 (기존 기능은 그대로)
  function closePostEdit() {
    const modal = $('postEditModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        window.location.href = '/posts';
      }, 200);
    } else {
      window.history.back?.() || (window.location.href = '/posts');
    }
  }

  function cancel() {
    closePostEdit();
  }

  // 전역 노출 (인라인 onclick 호환)
  window.closePostEdit = closePostEdit;
  window.PostEdit = {cancel};
  window.prevImage = prevImage;
  window.nextImage = nextImage;
  window.showImage = showImage;

  // (안전장치) 이 페이지는 post_detail.js를 포함하지 않을 수 있으므로
  // closeModal이 비어있을 때만 연결
  if (typeof window.closeModal !== 'function' && document.getElementById(
      'postEditModal')) {
    window.closeModal = closePostEdit;
  }
})();