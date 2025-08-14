// 게시글 수정 모듈 (필요 부분만 발췌/정리)
(function () {
  const $ = (id) => document.getElementById(id);

  // 이미지 갤러리 상태
  let images = [];
  let current = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initializeImageGallery();
    initializeImageManagement();
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

  /**
   * 이미지 관리 기능을 초기화합니다.
   * 
   * @description
   * - 이미지 삭제 버튼 이벤트 바인딩
   * - 이미지 추가 기능 설정
   * - 파일 입력 이벤트 처리
   */
  function initializeImageManagement() {
    // 이미지 삭제 버튼 이벤트 바인딩
    bindDeleteButtons();
    
    // 파일 입력 이벤트
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.addEventListener('change', handleImageAdd);
    }
    
    // 문자 카운터 초기화
    const contentTextarea = document.getElementById('content');
    const charCount = document.getElementById('contentCharCount');
    if (contentTextarea && charCount) {
      contentTextarea.addEventListener('input', () => {
        charCount.textContent = contentTextarea.value.length;
      });
    }
  }

  /**
   * 이미지 삭제 버튼 이벤트를 바인딩합니다.
   * 
   * @description
   * - 모든 삭제 버튼에 클릭 이벤트 추가
   * - 삭제 시 UI 업데이트 및 hidden input 처리
   */
  function bindDeleteButtons() {
    document.querySelectorAll('.thumb-delete-btn').forEach(btn => {
      btn.addEventListener('click', handleImageDelete);
    });
  }

  /**
   * 이미지 삭제를 처리합니다.
   * 
   * @param {Event} e - 클릭 이벤트
   * @description
   * - 썸네일과 keep input을 DOM에서 제거
   * - 갤러리 상태 업데이트
   * - 이미지 추가 버튼 상태 업데이트
   */
  function handleImageDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const deleteBtn = e.target;
    const imageId = deleteBtn.dataset.imageId;
    const thumbElement = deleteBtn.closest('.thumb');
    
    if (!thumbElement || !imageId) return;
    
    // DOM에서 썸네일 제거
    thumbElement.remove();
    
    // images 배열에서도 제거
    const thumbIndex = parseInt(thumbElement.dataset.index);
    if (thumbIndex >= 0 && thumbIndex < images.length) {
      images.splice(thumbIndex, 1);
    }
    
    // 현재 인덱스 조정
    if (current >= images.length && images.length > 0) {
      current = images.length - 1;
    } else if (images.length === 0) {
      current = 0;
    }
    
    // 남은 썸네일들의 인덱스 재정렬
    document.querySelectorAll('.thumb').forEach((thumb, index) => {
      thumb.dataset.index = index;
      if (index === current) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
    
    // 갤러리 업데이트
    update();
    updateThumbAddButton();
    
    // 이미지가 모두 삭제되었으면 플레이스홀더 표시
    if (images.length === 0) {
      showNoImagePlaceholder();
    }
  }

  /**
   * 새 이미지 추가를 처리합니다.
   * 
   * @param {Event} e - 파일 입력 이벤트
   * @description
   * - 선택된 파일들을 검증
   * - 최대 3장 제한 확인
   * - 새 썸네일 생성 및 갤러리 업데이트
   */
  function handleImageAdd(e) {
    const files = Array.from(e.target.files);
    const currentImageCount = document.querySelectorAll('.thumb').length;
    
    // 최대 3장 제한 확인
    if (currentImageCount + files.length > 3) {
      alert('이미지는 최대 3장까지만 업로드할 수 있습니다.');
      e.target.value = ''; // 파일 입력 초기화
      return;
    }
    
    // 파일 검증 및 썸네일 생성
    files.forEach((file, index) => {
      if (!validateImageFile(file)) {
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        createNewThumbnail(event.target.result, currentImageCount + index);
      };
      reader.readAsDataURL(file);
    });
    
    // 플레이스홀더 숨기기
    hideNoImagePlaceholder();
    updateThumbAddButton();
  }

  /**
   * 이미지 파일을 검증합니다.
   * 
   * @param {File} file - 검증할 파일
   * @return {boolean} 유효한 파일 여부
   */
  function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!allowedTypes.includes(file.type)) {
      alert(`${file.name}: 지원하지 않는 파일 형식입니다.`);
      return false;
    }
    
    if (file.size > maxSize) {
      alert(`${file.name}: 파일 크기가 50MB를 초과합니다.`);
      return false;
    }
    
    return true;
  }

  /**
   * 새 썸네일을 생성합니다.
   * 
   * @param {string} imageSrc - 이미지 데이터 URL
   * @param {number} index - 썸네일 인덱스
   */
  function createNewThumbnail(imageSrc, index) {
    const thumbsContainer = document.querySelector('.thumbs-container');
    const addBtn = document.querySelector('.thumb-add-btn');
    
    if (!thumbsContainer) return;
    
    // 새 썸네일 버튼 생성
    const newThumb = document.createElement('button');
    newThumb.type = 'button';
    newThumb.className = 'thumb';
    newThumb.dataset.index = index;
    
    // 이미지 요소 생성
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = `썸네일 ${index + 1}`;
    img.setAttribute('data-full', imageSrc);
    
    // 삭제 버튼 생성 (새 이미지는 imageId가 없음)
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'thumb-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', '이미지 삭제');
    deleteBtn.setAttribute('data-new-image', 'true');
    deleteBtn.addEventListener('click', handleNewImageDelete);
    
    newThumb.appendChild(img);
    newThumb.appendChild(deleteBtn);
    
    // 썸네일 클릭 이벤트
    newThumb.addEventListener('click', (e) => {
      if (e.target.closest('.thumb-delete-btn')) {
        return;
      }
      e.preventDefault();
      const index = parseInt(newThumb.dataset.index);
      if (!isNaN(index)) {
        showImage(index);
      }
    });
    
    // addBtn 앞에 삽입
    if (addBtn) {
      thumbsContainer.insertBefore(newThumb, addBtn);
    } else {
      thumbsContainer.appendChild(newThumb);
    }
    
    // images 배열에 추가
    images.push({
      url: imageSrc,
      alt: `이미지 ${index + 1}`,
      isNew: true
    });
    
    // 첫 번째 이미지면 활성화
    if (index === 0) {
      current = 0;
      newThumb.classList.add('active');
      update();
    }
    
    // 갤러리 표시
    showGallery();
  }

  /**
   * 새로 추가된 이미지의 삭제를 처리합니다.
   * 
   * @param {Event} e - 클릭 이벤트
   */
  function handleNewImageDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const deleteBtn = e.target;
    const thumbElement = deleteBtn.closest('.thumb');
    const thumbIndex = parseInt(thumbElement.dataset.index);
    
    // DOM에서 제거
    thumbElement.remove();
    
    // images 배열에서 제거
    if (thumbIndex >= 0 && thumbIndex < images.length) {
      images.splice(thumbIndex, 1);
    }
    
    // 파일 입력에서도 해당 파일 제거 (FileList는 불변이므로 새로 생성)
    const imageInput = document.getElementById('imageInput');
    if (imageInput && imageInput.files) {
      const dt = new DataTransfer();
      Array.from(imageInput.files).forEach((file, index) => {
        if (index !== thumbIndex) {
          dt.items.add(file);
        }
      });
      imageInput.files = dt.files;
    }
    
    // 인덱스 재정렬 및 갤러리 업데이트
    reindexThumbnails();
    updateAfterDelete();
  }

  /**
   * 썸네일 인덱스를 재정렬합니다.
   */
  function reindexThumbnails() {
    document.querySelectorAll('.thumb').forEach((thumb, index) => {
      thumb.dataset.index = index;
      const img = thumb.querySelector('img');
      if (img) {
        img.alt = `썸네일 ${index + 1}`;
      }
    });
  }

  /**
   * 삭제 후 갤러리 상태를 업데이트합니다.
   */
  function updateAfterDelete() {
    const thumbCount = document.querySelectorAll('.thumb').length;
    
    if (thumbCount === 0) {
      showNoImagePlaceholder();
      current = 0;
    } else {
      // 현재 인덱스 조정
      if (current >= thumbCount) {
        current = thumbCount - 1;
      }
      
      // 활성 상태 업데이트
      document.querySelectorAll('.thumb').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === current);
      });
      
      update();
    }
    
    updateThumbAddButton();
  }

  /**
   * 이미지 없음 플레이스홀더를 표시합니다.
   */
  function showNoImagePlaceholder() {
    const gallery = document.querySelector('.gallery');
    const placeholder = document.querySelector('.no-image-placeholder');
    
    if (gallery) gallery.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
  }

  /**
   * 이미지 없음 플레이스홀더를 숨깁니다.
   */
  function hideNoImagePlaceholder() {
    const placeholder = document.querySelector('.no-image-placeholder');
    if (placeholder) placeholder.style.display = 'none';
  }

  /**
   * 갤러리를 표시합니다.
   */
  function showGallery() {
    const gallery = document.querySelector('.gallery');
    if (gallery) gallery.style.display = 'block';
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
    initializeImageManagement: initializeImageManagement,
    bindDeleteButtons: bindDeleteButtons,
    handleImageDelete: handleImageDelete,
    handleImageAdd: handleImageAdd,
    validateImageFile: validateImageFile,
    createNewThumbnail: createNewThumbnail,
    reindexThumbnails: reindexThumbnails,
    updateAfterDelete: updateAfterDelete,
    showNoImagePlaceholder: showNoImagePlaceholder,
    hideNoImagePlaceholder: hideNoImagePlaceholder,
    showGallery: showGallery,
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