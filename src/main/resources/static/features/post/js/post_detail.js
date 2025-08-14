// 상세 보기 전역 함수들
(function () {
  // 상태
  let images = [];
  let current = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initializePostDetail();
    initializeRelativeTime();
  });

  /**
   * 게시글 상세 화면의 이미지 갤러리를 초기화합니다.
   * 썸네일 이미지 목록을 생성하고 초기 UI를 설정합니다.
   * 
   * @description 
   * - 썸네일 이미지들을 스캔하여 images 배열 생성
   * - 메인 이미지가 있으면 단일 이미지로 처리
   * - 초기 인덱스를 0으로 설정하고 UI 업데이트
   * - 이벤트 리스너 바인딩
   */
  function initializePostDetail() {
    const thumbs = document.querySelectorAll('.thumb img');
    const main = document.getElementById('mainImage');

    if (thumbs.length) {
      images = Array.from(thumbs).map((img, i) => ({
        url: img.dataset.full || img.src, // 원본 경로 있으면 사용
        alt: img.alt || `이미지 ${i + 1}`
      }));
    } else if (main?.src) {
      images = [{url: main.src, alt: '이미지 1'}];
    } else {
      images = [];
    }
    current = 0;
    update();
    bindThumbClicks();
  }

  /**
   * 썸네일과 화살표 버튼에 클릭 이벤트를 바인딩합니다.
   * 
   * @description
   * - 썸네일 클릭 시 해당 이미지로 이동
   * - 이전/다음 화살표 버튼 클릭 시 이미지 네비게이션
   * - 모든 이벤트에서 기본 동작 방지
   */
  function bindThumbClicks() {
    document.querySelectorAll('.thumb').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.index);
        if (!isNaN(index)) {
          showImage(index);
        }
      });
    });
    document.querySelector('.gallery-nav.prev')?.addEventListener('click',
        (e) => {
          e.preventDefault();
          prevImage();
        });
    document.querySelector('.gallery-nav.next')?.addEventListener('click',
        (e) => {
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
   * - 인디케이터 활성화 상태 업데이트
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
    document.querySelectorAll('.thumb').forEach(
        (t, i) => t.classList.toggle('active', i === current));
    const prev = document.querySelector('.gallery-nav.prev');
    const next = document.querySelector('.gallery-nav.next');
    if (prev && next) {
      const multi = images.length > 1;
      prev.style.display = multi ? 'flex' : 'none';
      next.style.display = multi ? 'flex' : 'none';
    }
    document.querySelectorAll('.indicator').forEach(
        (ind, i) => ind.classList.toggle('active', i === current));
  }

  /**
   * 이전 이미지로 이동합니다.
   * 
   * @description
   * - 현재 인덱스를 1 감소시킴 (순환)
   * - 이미지가 2개 이상일 때만 동작
   * - UI 업데이트 호출
   */
  function prevImage() {
    if (images.length > 1) {
      current = (current - 1 + images.length) % images.length;
      update();
    }
  }

  /**
   * 다음 이미지로 이동합니다.
   * 
   * @description
   * - 현재 인덱스를 1 증가시킴 (순환)
   * - 이미지가 2개 이상일 때만 동작
   * - UI 업데이트 호출
   */
  function nextImage() {
    if (images.length > 1) {
      current = (current + 1) % images.length;
      update();
    }
  }

  /**
   * 특정 인덱스의 이미지를 표시합니다.
   * 
   * @param {number} i - 표시할 이미지의 인덱스
   * @description
   * - 유효한 인덱스인지 검증
   * - 현재 인덱스를 지정된 값으로 설정
   * - UI 업데이트 호출
   */
  function showImage(i) {
    if (i >= 0 && i < images.length) {
      current = i;
      update();
    }
  }

  // 드롭다운
  /**
   * 모든 드롭다운 메뉴를 닫습니다.
   * 
   * @description
   * - 페이지 내 모든 .dropdown-menu 요소에서 'show' 클래스 제거
   * - 다른 드롭다운 열기 전 정리 작업에 사용
   */
  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(
        el => el.classList.remove('show'));
  }

  /**
   * 게시글 옵션 드롭다운을 토글합니다.
   * 
   * @description
   * - 현재 드롭다운이 열려있으면 닫고, 닫혀있으면 엽니다
   * - 다른 모든 드롭다운을 먼저 닫습니다
   * - 드롭다운 요소가 없으면 아무 동작하지 않습니다
   */
  function togglePostDropdown() {
    const dd = document.getElementById('postDropdown');
    if (!dd) {
      return;
    }
    const isOpen = dd.classList.contains('show');
    closeAllDropdowns();
    if (!isOpen) {
      dd.classList.add('show');
    }
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      closeAllDropdowns();
    }
  });

  // 댓글
  /**
   * 댓글 입력 창에 포커스를 주고 화면에 표시합니다.
   * 
   * @description
   * - 댓글 textarea에 포커스 설정
   * - 부드러운 스크롤로 댓글 입력 영역을 화면 중앙에 표시
   * - textarea가 없으면 아무 동작하지 않습니다
   */
  function focusCommentInput() {
    const tx = document.getElementById('commentTextarea');
    if (!tx) {
      return;
    }
    tx.focus();
    setTimeout(() => tx.scrollIntoView({behavior: 'smooth', block: 'center'}),
        80);
  }

  // 상대 시간
  /**
   * 상대 시간 표시를 초기화합니다.
   * 
   * @description
   * - time_util.js 모듈을 동적으로 로드
   * - data-time 속성을 가진 요소들의 시간을 상대 시간으로 변환
   * - 1분마다 자동으로 시간 업데이트
   * - 모듈 로드 실패 시 조용히 무시
   */
  function initializeRelativeTime() {
    import('/common/js/utils/time_util.js').then(m => {
      const fmt = m.formatRelativeTime;
      const nodes = document.querySelectorAll('.relative-time[data-time]');
      nodes.forEach(n => {
        const d = new Date(n.getAttribute('data-time'));
        n.textContent = fmt(d);
      });
      setInterval(() => {
        nodes.forEach(n => {
          const d = new Date(n.getAttribute('data-time'));
          n.textContent = fmt(d);
        });
      }, 60000);
    }).catch(() => {
    });
  }

  // 닫기 (SSR 상세 페이지 or AJAX 모달 모두 지원)
  /**
   * 모달을 닫거나 상세 페이지에서 나갑니다.
   * 
   * @description
   * - AJAX 모달인 경우: closePostDetail() 함수 호출
   * - SSR 상세 페이지인 경우: 게시글 목록으로 이동
   * - 모달 요소가 있으면 닫기 애니메이션 적용 후 페이지 이동
   */
  function closeModal() {
    // 리스트에서 띄운 AJAX 모달이면 전용 닫기 사용
    if (typeof window.closePostDetail
        === 'function') {
      return window.closePostDetail();
    }

    // 단독 상세 페이지면 목록으로 이동
    const modal = document.getElementById('postDetailModal');
    if (!modal) {
      window.location.href = '/posts';
      return;
    }
    modal.classList.add('closing');
    modal.addEventListener('animationend', () => {
      window.location.href = '/posts';
    }, {once: true});
  }

  // 삭제
  /**
   * 게시글을 삭제합니다.
   * 
   * @async
   * @description
   * - 모달 또는 URL에서 게시글 ID 추출
   * - 사용자 확인 후 DELETE 요청 전송
   * - CSRF 토큰을 포함하여 보안 처리
   * - 성공 시 모달 닫기 후 목록 페이지로 이동
   * - 실패 시 오류 메시지 표시
   */
  async function deletePost() {
    const modal = document.getElementById('postDetailModal');
    let id = modal?.dataset.postId || modal?.getAttribute('data-post-id');
    
    // 모달에서 ID를 찾지 못한 경우 URL에서 추출
    if (!id) {
      const urlPath = window.location.pathname;
      const match = urlPath.match(/\/posts\/(\d+)/);
      id = match ? match[1] : null;
    }
    
    if (!id) {
      console.error('Modal element:', modal);
      console.error('URL path:', window.location.pathname);
      return alert('게시글 ID를 찾지 못했습니다.');
    }
    if (!confirm('정말로 삭제하시겠습니까?')) {
      return;
    }

    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector(
        'meta[name="_csrf_header"]')?.content;

    try {
      const res = await fetch(`/posts/${id}`, {
        method: 'DELETE',
        headers: csrfToken && csrfHeader ? {[csrfHeader]: csrfToken} : {}
      });
      if (res.ok || res.status === 302 || res.status === 303 || res.status === 405) {
        if (window.closePostDetail) {
          window.closePostDetail();
        }
        setTimeout(() => {
          alert('게시글이 삭제되었습니다.');
          window.location.href = '/posts';
        }, 200);
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (_) {
      alert('서버와 통신 중 문제가 발생했습니다.');
    }
  }

  /**
   * 게시글 수정 모달을 엽니다.
   * 
   * @async
   * @param {string|number} [id] - 수정할 게시글 ID (없으면 현재 상세 모달의 ID 사용)
   * @description
   * - AJAX로 수정 폼을 동적 로드
   * - 수정 모달이 없으면 동적으로 생성
   * - PostEdit 객체 초기화 및 이벤트 바인딩
   * - 스크립트 초기화 및 함수 충돌 방지
   * - 실패 시 SSR 수정 페이지로 폴백
   */
  async function openPostEdit(id) {
    // id 인자가 없으면 현재 상세 모달의 data-post-id 사용
    const targetId = id || document.getElementById(
        'postDetailModal')?.dataset?.postId;
    if (!targetId) {
      console.error('openPostEdit: postId가 없습니다.');
      return;
    }

    try {
      // 게시글 수정 모달을 AJAX로 로드
      let editModal = document.getElementById('postEditModal');
      if (!editModal) {
        // 수정 모달이 없으면 동적으로 생성
        editModal = document.createElement('div');
        editModal.id = 'postEditModal';
        editModal.className = 'modal';
        document.body.appendChild(editModal);
      }

      // 로딩 UI 표시
      editModal.style.display = 'flex';
      editModal.classList.add('show');
      editModal.innerHTML = '<div class="modal-loading"><div class="loading-spinner"></div><p>게시글을 불러오는 중...</p></div>';

      // 수정 페이지 내용을 AJAX로 로드
      const res = await fetch(`/posts/${targetId}/edit`, {
        headers: {'X-Requested-With': 'XMLHttpRequest'}
      });
      
      if (!res.ok) {
        throw new Error('Failed to load edit form');
      }
      
      const html = await res.text();
      
      // HTML 파싱 후 모달 콘텐츠만 추출
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const content = doc.querySelector('.modal-content') || doc.querySelector('main') || doc.body;
      
      if (!content) {
        throw new Error('Edit form content not found');
      }

      // 모달 콘텐츠 설정
      editModal.innerHTML = '';
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.appendChild(content.cloneNode(true));
      editModal.appendChild(modalContent);

      // 모달에 post ID 설정
      editModal.setAttribute('data-post-id', targetId);
      editModal.dataset.postId = targetId;

      // PostEdit 객체가 없으면 기본 함수들을 정의
      if (!window.PostEdit) {
        window.PostEdit = {
          cancel: function() {
            window.closePostEdit();
          },
          close: function() {
            window.closePostEdit();
          },
          closePostEdit: function() {
            window.closePostEdit();
          }
        };
      }

      // 수정 페이지의 스크립트 초기화
      setTimeout(() => {
        // PostEdit 모드 활성화 (함수 충돌 방지)
        if (window.PostEdit && typeof window.PostEdit.activate === 'function') {
          window.PostEdit.activate();
        }

        if (typeof window.initializeImageGallery === 'function') {
          window.initializeImageGallery();
        }

        // 이미지 관리 기능 초기화
        if (window.PostEdit && typeof window.PostEdit.initializeImageManagement === 'function') {
          window.PostEdit.initializeImageManagement();
        }

        // thumb-add-btn 상태 업데이트
        if (typeof window.updateThumbAddButton === 'function') {
          window.updateThumbAddButton();
        }

        // 모달 공통 초기화(ESC, 배경클릭 등)
        if (typeof window.initModal === 'function') {
          window.initModal();
        }
      }, 100);

    } catch (err) {
      console.error('openPostEdit 오류:', err);
      // 실패 시 기존 방식으로 폴백
      window.location.href = `/posts/${targetId}/edit`;
    }
  }

  // 전역 내보내기
  window.prevImage = prevImage;
  window.nextImage = nextImage;
  window.showImage = showImage;
  window.focusCommentInput = focusCommentInput;
  window.togglePostDropdown = togglePostDropdown;
  window.deletePost = deletePost;
  window.openPostEdit = openPostEdit;
  window.closeModal = closeModal;           // ← 상세 모달 닫기
  window.initializePostDetail = initializePostDetail;
})();
