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
    const id = modal?.dataset.postId;
    if (!id) {
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
      if (res.ok || res.status === 302 || res.status === 303) {
        if (window.closePostDetail) {
          window.closePostDetail();
        }
        setTimeout(() => {
          alert('게시글이 삭제되었습니다.');
          window.location.href = '/posts';
        }, 200);
      } else if (res.status === 405) {
        alert('서버가 DELETE 메서드를 허용하지 않습니다. 컨트롤러 매핑을 확인하세요.');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (_) {
      alert('서버와 통신 중 문제가 발생했습니다.');
    }
  }

  function openPostEdit(id) {
    // id 인자가 없으면 현재 상세 모달의 data-post-id 사용
    const targetId = id || document.getElementById(
        'postDetailModal')?.dataset?.postId;
    if (!targetId) {
      console.error('openPostEdit: postId가 없습니다.');
      return;
    }

    // 만약 수정 모달을 AJAX로 띄우는 모듈이 있다면 우선 사용
    if (window.PostEdit && typeof window.PostEdit.open === 'function') {
      window.PostEdit.open(targetId);
      return;
    }

    // 기본: SSR 편집 페이지로 이동
    window.location.href = `/posts/${targetId}/edit`;
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
