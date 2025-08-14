// 게시글 수정 모듈 (필요 부분만 발췌/정리)
(function () {
  const $ = (id) => document.getElementById(id);

  // 이미지 갤러리 상태
  let images = [];
  let current = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initializeImageGallery();
  });

  /**
   * 게시글 수정 화면의 이미지 갤러리를 초기화합니다.
   * 
   * @description
   * - 기존 이미지들을 스캔하여 images 배열 생성
   * - 메인 이미지 설정 및 썸네일 이벤트 바인딩
   * - 이미지 추가 버튼 상태 업데이트
   * - 게시글 상세와 동일한 갤러리 기능 제공
   */
  function initializeImageGallery() {
    const thumbs = document.querySelectorAll('.thumb img');
    const main = document.getElementById('mainImage');

    if (thumbs.length) {
      images = Array.from(thumbs).map((img, i) => ({
        url: img.dataset.full || img.src,   // 상세와 동일: 원본 우선
        alt: img.alt || `이미지 ${i + 1}`
      }));
    } else if (main?.src) {
      images = [{url: main.src, alt: '이미지 1'}];
    } else {
      images = [];
    }
    current = 0;
    update();
    bindGalleryEvents();
    // 초기 로드 시에도 add-btn 상태 업데이트
    updateThumbAddButton();
  }

  /**
   * 갤러리 이벤트들을 바인딩합니다.
   * 
   * @description
   * - 썸네일 클릭 시 이미지 전환 (삭제 버튼 제외)
   * - 화살표 버튼 클릭 시 이미지 네비게이션
   * - 게시글 상세와 동일한 이벤트 처리
   */
  function bindGalleryEvents() {
    // 썸네일 클릭 이벤트 (게시글 상세와 동일)
    document.querySelectorAll('.thumb').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        // 썸네일 안의 삭제 버튼을 눌렀을 때는 이미지 전환 금지
        if (e.target.closest('.thumb-delete-btn')) {
          return;
        }
        e.preventDefault();
        const index = parseInt(btn.dataset.index);
        if (!isNaN(index)) {
          showImage(index);
        }
      });
    });

    // 화살표 버튼 이벤트 (게시글 상세와 동일)
    document.querySelector('.gallery-nav.prev')?.addEventListener('click', (e) => {
      e.preventDefault();
      prevImage();
    });
    document.querySelector('.gallery-nav.next')?.addEventListener('click', (e) => {
      e.preventDefault();
      nextImage();
    });
  }

  /**
   * 현재 선택된 이미지에 맞춰 UI를 업데이트합니다.
   * 
   * @description
   * - 메인 이미지 교체 (페이드 효과 포함)
   * - 썸네일 활성화 상태 업데이트
   * - 화살표 버튼 표시/숨김 처리
   * - 이미지 추가 버튼 상태 업데이트
   * - 게시글 상세와 동일한 업데이트 로직
   */
  function update() {
    const main = document.getElementById('mainImage');
    if (main && images[current]) {
      main.style.opacity = '0.5';
      setTimeout(() => {
        main.src = images[current].url;
        main.alt = images[current].alt;
        main.style.opacity = '1';
      }, 120);
    }

    // 썸네일 활성화 상태 업데이트 (게시글 상세와 동일)
    document.querySelectorAll('.thumb').forEach(
        (t, i) => t.classList.toggle('active', i === current));

    // 화살표 버튼 표시/숨김 (게시글 상세와 동일)
    const prev = document.querySelector('.gallery-nav.prev');
    const next = document.querySelector('.gallery-nav.next');
    if (prev && next) {
      const multi = images.length > 1;
      prev.style.display = multi ? 'flex' : 'none';
      next.style.display = multi ? 'flex' : 'none';
    }

    // 인디케이터 활성화 상태 업데이트 (게시글 상세와 동일)
    document.querySelectorAll('.indicator').forEach(
        (ind, i) => ind.classList.toggle('active', i === current));

    // thumb-add-btn 표시/숨김 (최대 3장일 때 숨김)
    updateThumbAddButton();
  }

  /**
   * 이미지 추가 버튼의 표시/숨김 상태를 업데이트합니다.
   * 
   * @description
   * - 현재 이미지 개수가 3장 이상이면 추가 버튼 숨김
   * - 3장 미만이면 추가 버튼 표시
   * - 최대 이미지 개수 제한 적용
   */
  function updateThumbAddButton() {
    const addBtn = document.querySelector('.thumb-add-btn');
    const currentImageCount = document.querySelectorAll('.thumb').length;

    if (addBtn) {
      if (currentImageCount >= 3) {
        addBtn.style.display = 'none';
      } else {
        addBtn.style.display = 'flex';
      }
    }
  }

  function prevImage() {
    if (images.length > 1) {
      current = (current - 1 + images.length) % images.length;
      update();
    }
  }

  function nextImage() {
    if (images.length > 1) {
      current = (current + 1) % images.length;
      update();
    }
  }

  function showImage(i) {
    if (i >= 0 && i < images.length) {
      current = i;
      update();
    }
  }

  // 필요한 최소 전역만 유지 (기존 기능은 그대로)
  function closePostEdit() {
    // PostEdit 모드 비활성화 (원본 함수들 복원)
    if (window.PostEdit && typeof window.PostEdit.restore === 'function') {
      window.PostEdit.restore();
    }
    
    const modal = $('postEditModal');
    if (modal) {
      // 모달인 경우 - 다른 모달들처럼 닫기만 하고 페이지는 그대로 유지
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.innerHTML = '';
      }, 250);
    } else {
      // 단독 페이지인 경우 - 기존 방식대로 페이지 이동
      window.history.back?.() || (window.location.href = '/posts');
    }
  }

  function cancel() {
    closePostEdit();
  }

  // 기존 함수들 백업
  const originalFunctions = {
    prevImage: window.prevImage,
    nextImage: window.nextImage,  
    showImage: window.showImage,
    update: window.update
  };

  // PostEdit 네임스페이스에 함수들 정의
  window.PostEdit = {
    cancel: cancel,
    close: closePostEdit,
    closePostEdit: closePostEdit,
    prevImage: prevImage,
    nextImage: nextImage,
    showImage: showImage,
    update: update,
    updateThumbAddButton: updateThumbAddButton,
    initializeImageGallery: initializeImageGallery,
    // 원본 함수들 복원
    restore: function() {
      window.prevImage = originalFunctions.prevImage;
      window.nextImage = originalFunctions.nextImage;
      window.showImage = originalFunctions.showImage;
      window.update = originalFunctions.update;
    },
    // 수정 모드 함수들로 변경
    activate: function() {
      window.prevImage = prevImage;
      window.nextImage = nextImage;
      window.showImage = showImage;
      window.update = update;
    }
  };

  // 전역 함수들 (모달에서만 사용시 활성화)
  window.closePostEdit = closePostEdit;
  window.updateThumbAddButton = updateThumbAddButton;
  window.initializeImageGallery = initializeImageGallery;

  // (안전장치) 이 페이지는 post_detail.js를 포함하지 않을 수 있으므로
  // closeModal이 비어있을 때만 연결
  if (typeof window.closeModal !== 'function' && document.getElementById(
      'postEditModal')) {
    window.closeModal = closePostEdit;
  }
})();