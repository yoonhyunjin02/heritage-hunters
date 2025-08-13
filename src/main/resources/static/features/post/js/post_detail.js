// 전역 변수
let currentImageIndex = 0;
let totalImages = 0;
let images = [];
let postId = null;

// 드래그 관련 변수
let isDragging = false;
let startX = 0;
let currentX = 0;
let dragThreshold = 50; // 드래그 최소 거리

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function () {
  initializePostDetail();
  initializeRelativeTime();
});

// 게시글 상세 초기화
function initializePostDetail() {
  // HTML의 data 속성에서 데이터 가져오기
  const modalElement = document.getElementById('postDetailModal');
  if (modalElement) {
    postId = modalElement.dataset.postId;
    totalImages = parseInt(modalElement.dataset.totalImages) || 0;

    // 이미지 URL들을 파싱
    const imageUrls = modalElement.dataset.images
        ? modalElement.dataset.images.split('|') : [];

    images = imageUrls.map((url, index) => ({
      url: url,
      alt: `이미지 ${index + 1}`
    }));
  }

  initModal();
  initCommentCounter();
  initImageGallery();
  initDropdowns();
}

// 모달 초기화
function initModal() {
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // 모달 배경 클릭시 닫기
  const modal = document.getElementById('postDetailModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // 모달이 열릴 때 애니메이션 효과는 CSS에서 처리됨
}

// 모달 닫기
function closeModal() {
  // 게시글 리스트에서 열린 모달인 경우
  if (window.closePostDetail) {
    window.closePostDetail();
    return;
  }
  
  // 직접 게시글 상세 페이지에서 온 경우
  const modal = document.getElementById('postDetailModal');
  const modalContent = modal?.querySelector('.modal-content');
  
  if (modalContent) {
    modalContent.style.transform = 'scale(0.9)';
    modalContent.style.opacity = '0';
    modal.style.opacity = '0';

    setTimeout(() => {
      window.location.href = '/posts';
    }, 200);
  } else {
    window.location.href = '/posts';
  }
}

// 댓글 글자 수 카운터 초기화
function initCommentCounter() {
  const textarea = document.getElementById('commentTextarea');
  const counter = document.getElementById('commentCharCount');

  if (textarea && counter) {
    function updateCounter() {
      const length = textarea.value.length;
      counter.textContent = length;

      // 글자 수에 따른 색상 변경
      if (length >= 180) {
        counter.style.color = '#e74c3c';
        counter.style.fontWeight = 'bold';
      } else if (length >= 150) {
        counter.style.color = '#f39c12';
        counter.style.fontWeight = '600';
      } else {
        counter.style.color = '#6c757d';
        counter.style.fontWeight = '500';
      }
    }

    // 이벤트 리스너 등록
    textarea.addEventListener('input', updateCounter);
    textarea.addEventListener('paste', () => setTimeout(updateCounter, 10));

    // 초기 카운터 설정
    updateCounter();

    // 텍스트 영역 자동 크기 조절
    textarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  }
}

// 이미지 갤러리 초기화
function initImageGallery() {
  if (totalImages <= 1) {
    return;
  }

  currentImageIndex = 0;
  updateGalleryDisplay();
  initDragHandlers();

  // 키보드 네비게이션
  document.addEventListener('keydown', function (e) {
    if (totalImages > 1) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      }
    }
  });
}

// 드래그 핸들러 초기화
function initDragHandlers() {
  const galleryMain = document.getElementById('galleryMain');
  if (!galleryMain) {
    return;
  }

  // 마우스 이벤트
  galleryMain.addEventListener('mousedown', handleDragStart);
  galleryMain.addEventListener('mousemove', handleDragMove);
  galleryMain.addEventListener('mouseup', handleDragEnd);
  galleryMain.addEventListener('mouseleave', handleDragEnd);

  // 터치 이벤트
  galleryMain.addEventListener('touchstart', handleDragStart, {passive: false});
  galleryMain.addEventListener('touchmove', handleDragMove, {passive: false});
  galleryMain.addEventListener('touchend', handleDragEnd);
}

// 드래그 시작
function handleDragStart(e) {
  if (totalImages <= 1) {
    return;
  }

  isDragging = true;
  startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
  currentX = startX;

  const galleryMain = document.getElementById('galleryMain');
  if (galleryMain) {
    galleryMain.classList.add('dragging');
  }

  e.preventDefault();
}

// 드래그 중
function handleDragMove(e) {
  if (!isDragging || totalImages <= 1) {
    return;
  }

  currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
  const deltaX = currentX - startX;

  // 이미지에 변형 적용 (미리보기 효과)
  const mainImage = document.getElementById('mainImage');
  if (mainImage && Math.abs(deltaX) > 10) {
    const opacity = Math.max(0.7, 1 - Math.abs(deltaX) / 200);
    mainImage.style.opacity = opacity;
    mainImage.style.transform = `translateX(${deltaX * 0.3}px)`;
  }

  e.preventDefault();
}

// 드래그 끝
function handleDragEnd(e) {
  if (!isDragging || totalImages <= 1) {
    return;
  }

  const deltaX = currentX - startX;
  const galleryMain = document.getElementById('galleryMain');
  const mainImage = document.getElementById('mainImage');

  // 드래그 거리가 충분하면 이미지 변경
  if (Math.abs(deltaX) > dragThreshold) {
    if (deltaX > 0) {
      // 오른쪽으로 드래그 = 이전 이미지
      prevImage();
    } else {
      // 왼쪽으로 드래그 = 다음 이미지
      nextImage();
    }
  }

  // 상태 초기화
  isDragging = false;
  startX = 0;
  currentX = 0;

  if (galleryMain) {
    galleryMain.classList.remove('dragging');
  }

  if (mainImage) {
    mainImage.style.opacity = '1';
    mainImage.style.transform = 'translateX(0)';
  }
}

// 갤러리 표시 업데이트
function updateGalleryDisplay() {
  const mainImage = document.getElementById('mainImage');
  const thumbnails = document.querySelectorAll('.thumb');
  const indicators = document.querySelectorAll('.indicator');

  if (mainImage && images[currentImageIndex]) {
    // 이미지 변경 시 페이드 효과
    mainImage.style.opacity = '0.5';

    setTimeout(() => {
      mainImage.src = images[currentImageIndex].url;
      mainImage.alt = images[currentImageIndex].alt;
      mainImage.style.opacity = '1';
      mainImage.style.transform = 'translateX(0)'; // 변형 초기화
    }, 150);
  }

  // 썸네일 활성화 상태 업데이트
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.classList.toggle('active', index === currentImageIndex);
  });

  // 인디케이터 활성화 상태 업데이트
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentImageIndex);
  });

  // 네비게이션 버튼 상태 업데이트
  const prevBtn = document.querySelector('.gallery-nav.prev');
  const nextBtn = document.querySelector('.gallery-nav.next');

  if (prevBtn && nextBtn) {
    prevBtn.style.opacity = currentImageIndex === 0 ? '0.5' : '1';
    nextBtn.style.opacity = currentImageIndex === totalImages - 1 ? '0.5' : '1';
  }
}

// 이전 이미지
function prevImage() {
  if (totalImages > 1) {
    currentImageIndex = (currentImageIndex - 1 + totalImages) % totalImages;
    updateGalleryDisplay();
  }
}

// 다음 이미지
function nextImage() {
  if (totalImages > 1) {
    currentImageIndex = (currentImageIndex + 1) % totalImages;
    updateGalleryDisplay();
  }
}

// 특정 이미지 표시
function showImage(index) {
  if (index >= 0 && index < totalImages) {
    currentImageIndex = index;
    updateGalleryDisplay();
  }
}

// 드롭다운 메뉴 초기화
function initDropdowns() {
  // 문서 전체 클릭 시 모든 드롭다운 닫기
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
      closeAllDropdowns();
    }
  });
}

// 모든 드롭다운 닫기
function closeAllDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown-menu');
  dropdowns.forEach(dropdown => {
    dropdown.classList.remove('show');
  });
}

// 게시글 드롭다운 토글
function toggleDropdown() {
  const dropdown = document.getElementById('postDropdown');
  if (dropdown) {
    const isOpen = dropdown.classList.contains('show');
    closeAllDropdowns();

    if (!isOpen) {
      dropdown.classList.add('show');
    }
  }
}

// 댓글 입력창에 포커스
function focusCommentInput() {
  const textarea = document.getElementById('commentTextarea');
  if (textarea) {
    textarea.focus();

    // 부드럽게 스크롤
    setTimeout(() => {
      textarea.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  }
}

// 게시글 삭제
async function deletePost() {
  const modalElement = document.getElementById('postDetailModal');
  const postId = modalElement ? modalElement.dataset.postId : null;

  if (!postId) {
    console.error('게시글 ID가 없습니다.');
    return;
  }

  if (!confirm('정말로 이 게시글을 삭제하시겠습니까?\n\n삭제된 게시글은 복구할 수 없습니다.')) {
    return;
  }

  // CSRF 값 읽기
  const csrfToken = document.querySelector('meta[name="_csrf"]').content;
  const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;

  try {
    const response = await fetch(`/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        [csrfHeader]: csrfToken
      }
    });

    if (response.ok) {
      alert('게시글이 삭제되었습니다.');
      window.location.href = '/posts';
    } else if (response.status === 403) {
      alert('삭제 권한이 없습니다.');
    } else {
      const text = await response.text();
      console.error('삭제 실패:', text);
      alert('삭제 중 오류가 발생했습니다.');
    }
  } catch (err) {
    console.error('네트워크 오류:', err);
    alert('서버와 통신 중 문제가 발생했습니다.');
  }
}

// 이미지 로드 에러 처리
function handleImageError(img) {
  img.style.display = 'none';

  // 에러 표시 요소 생성
  const errorDiv = document.createElement('div');
  errorDiv.className = 'image-error';
  errorDiv.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        background: #f8f9fa;
        color: #6c757d;
        font-size: 14px;
        border-radius: 8px;
      ">
        이미지를 불러올 수 없습니다
      </div>
    `;

  img.parentNode.insertBefore(errorDiv, img.nextSibling);
}

// 이미지에 에러 핸들러 추가
document.addEventListener('DOMContentLoaded', function () {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', function () {
      handleImageError(this);
    });
  });
});

// 상대시간 초기화
function initializeRelativeTime() {
  // time_util.js 모듈 import
  import('/common/js/utils/time_util.js').then(module => {
    const { formatRelativeTime } = module;
    
    // 모든 relative-time 클래스를 가진 요소들 찾기
    const timeElements = document.querySelectorAll('.relative-time[data-time]');
    
    timeElements.forEach(element => {
      const datetime = element.getAttribute('data-time');
      if (datetime) {
        try {
          const date = new Date(datetime);
          element.textContent = formatRelativeTime(date);
        } catch (error) {
          console.error('날짜 변환 오류:', error);
        }
      }
    });
    
    // 1분마다 상대시간 업데이트
    setInterval(() => {
      updateRelativeTimes(formatRelativeTime);
    }, 60000);
  }).catch(error => {
    console.error('time_util.js 로드 실패:', error);
  });
}

// 상대시간 업데이트
function updateRelativeTimes(formatRelativeTime) {
  const timeElements = document.querySelectorAll('.relative-time[data-time]');
  
  timeElements.forEach(element => {
    const datetime = element.getAttribute('data-time');
    if (datetime) {
      try {
        const date = new Date(datetime);
        element.textContent = formatRelativeTime(date);
      } catch (error) {
        console.error('날짜 변환 오류:', error);
      }
    }
  });
}

// 전역 함수로 내보내기 (HTML에서 직접 호출하는 함수들)
window.closeModal = closeModal;
window.toggleDropdown = toggleDropdown;
window.focusCommentInput = focusCommentInput;
window.deletePost = deletePost;
window.prevImage = prevImage;
window.nextImage = nextImage;
window.showImage = showImage;
window.initializePostDetail = initializePostDetail;