// 상세 보기 전역 함수들
(function () {
  // 상태
  let images = [];
  let current = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initializePostDetail();
    initializeRelativeTime();
  });

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

  // 드롭다운
  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(
        el => el.classList.remove('show'));
  }

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
