// features/post/js/post_list.js
// 모든 공개 함수는 전역에 노출(window.*)하여 템플릿의 inline 핸들러가 바로 쓸 수 있게 한다.

(function () {
  // --- 상태 캐시 ---
  const loadingPosts = new Set();
  const postDataCache = new Map();

  // --------------------------->
  // 전역: 검색/정렬/필터 submit
  // --------------------------->
  window.submitForm = function submitForm() {
    try {
      const f = document.getElementById('searchForm');
      if (f) {
        f.submit();
      }
    } catch (e) {
      console.error('submitForm 오류:', e);
    }
  };

  // --------------------------->
  // 커스텀 셀렉트 드롭다운 기능
  // --------------------------->
  
  // 커스텀 셀렉트 드롭다운 토글 (region filter용)
  window.toggleRegionDropdown = function(trigger) {
    const customSelect = trigger.parentElement;
    customSelect.classList.toggle('open');
    
    // 다른 드롭다운들 닫기
    document.querySelectorAll('.custom-select').forEach(select => {
      if (select !== customSelect) {
        select.classList.remove('open');
      }
    });
  };

  // 옵션 선택
  window.selectOption = function(option) {
    const customSelect = option.closest('.custom-select');
    const trigger = customSelect.querySelector('.select-trigger');
    const selectedText = trigger.querySelector('.selected-text');
    const hiddenInput = document.getElementById('regionInput');
    const value = option.getAttribute('data-value');
    
    selectedText.textContent = option.textContent;
    hiddenInput.value = value;
    customSelect.classList.remove('open');
    
    // 폼 제출
    submitForm();
  };

  // 외부 클릭시 드롭다운 닫기
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.custom-select')) {
      document.querySelectorAll('.custom-select').forEach(select => {
        select.classList.remove('open');
      });
    }
  });

  // --------------------------->
  // 전역 네임스페이스
  // --------------------------->
  window.PostListManager = window.PostListManager || {};

  // PostEdit 전역 객체 정의 (모달에서 사용)
  window.PostEdit = window.PostEdit || {
    cancel: function() {
      if (typeof window.closePostEdit === 'function') {
        window.closePostEdit();
      }
    },
    close: function() {
      if (typeof window.closePostEdit === 'function') {
        window.closePostEdit();
      }
    },
    closePostEdit: function() {
      if (typeof window.closePostEdit === 'function') {
        window.closePostEdit();
      }
    }
  };

  // 게시글 작성 모달 열기 (post_write.js 의 window.PostModal 사용)
  window.PostListManager.openPostModal = function openPostModal() {
    try {
      if (window.PostModal && typeof window.PostModal.open === 'function') {
        window.PostModal.open();
      } else {
        // fallback: data-open-post-modal 트리거 클릭
        const t = document.querySelector('[data-open-post-modal]');
        if (t) {
          t.click();
        }
      }
    } catch (e) {
      console.error('openPostModal 오류:', e);
    }
  };

  // 특정 게시글의 캐시를 무효화 (수정 후 즉시 반영을 위해)
  window.PostListManager.clearPostCache = function clearPostCache(postId) {
    try {
      if (postId) {
        const cacheKey = `post_${postId}`;
        if (postDataCache.has(cacheKey)) {
          postDataCache.delete(cacheKey);
        }
      }
    } catch (e) {
      console.error('clearPostCache 오류:', e);
    }
  };

  // --------------------------->
  // 전역: 게시글 상세 모달 열기 (카드/댓글 버튼에서 inline 호출 가능)
  // --------------------------->
  window.openPostDetail = async function openPostDetail(postId, focusComments) {
    try {
      if (!postId) {
        return;
      }

      // 중복요청 방지
      if (loadingPosts.has(postId)) {
        return;
      }
      loadingPosts.add(postId);

      let modal = document.getElementById('postDetailModal');
      if (!modal) {
        // 목록 페이지에 프래그먼트가 없으면 SSR 상세로 이동
        window.location.href = `/posts/${postId}`;
        return;
      }

      // 로딩 UI
      modal.style.display = 'flex';
      modal.classList.add('show');
      modal.innerHTML =
          '<div class="modal-loading"><div class="loading-spinner"></div><p>게시글을 불러오는 중...</p></div>';

      // 캐시 사용 또는 서버에서 로드 (성능 최적화)
      let html;
      const cacheKey = `post_${postId}`;
      
      // 메모리 캐시 확인
      if (postDataCache.has(cacheKey)) {
        html = postDataCache.get(cacheKey);
      } else {
        const startTime = performance.now();
        
        const res = await fetch(`/posts/${postId}`, {
          headers: {'X-Requested-With': 'XMLHttpRequest'}
          // cache: 'no-cache' 제거하여 브라우저 캐시 활용
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('서버 에러:', res.status, errorText);
          throw new Error(`Failed to load post: ${res.status} ${res.statusText}`);
        }
        
        html = await res.text();
        postDataCache.set(cacheKey, html);
      }

      // 모달 콘텐츠 추출 및 렌더링 최적화
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const content = doc.querySelector('#postDetailModal .modal-content');
      
      if (!content) {
        throw new Error('Modal content not found');
      }

      // DOM 조작 최적화: 한 번에 교체
      const fragment = document.createDocumentFragment();
      fragment.appendChild(content.cloneNode(true));
      
      modal.innerHTML = '';
      modal.appendChild(fragment);

      // 모달에 post ID 설정
      modal.setAttribute('data-post-id', postId);
      modal.dataset.postId = postId;

      // 댓글 포커스 옵션
      if (focusComments) {
        setTimeout(() => {
          const textarea = modal.querySelector('#commentTextarea');
          if (textarea) {
            textarea.focus();
            textarea.scrollIntoView({behavior: 'smooth', block: 'center'});
          }
        }, 250);
      }

      // 이벤트 리스너 초기화
      // 상세 스크립트 초기화(이미 로드돼 있다고 가정)
      if (typeof window.initializePostDetail === 'function') {
        window.initializePostDetail();
      }
      
      // 댓글 폼 초기화
      if (typeof window.initializeCommentForm === 'function') {
        window.initializeCommentForm();
      }

      // 좋아요 버튼은 like_manager.js에서 자동으로 전역 바인딩됨
      // 모달 내부의 새로운 버튼들도 자동으로 감지됨 (DOM 위임 패턴)

      // 모달 공통 초기화(ESC, 배경클릭 등)
      if (typeof window.initModal === 'function') {
        window.initModal();
      }
    } catch (err) {
      console.error('openPostDetail 오류:', err);
      const modal = document.getElementById('postDetailModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.innerHTML = '<div class="modal-error">게시글을 불러올 수 없습니다.</div>';
      }
    } finally {
      loadingPosts.delete(postId);
    }
  };

  // --------------------------->
  // 전역: 게시글 상세 모달 닫기 (AJAX 모달용)
  // --------------------------->
  window.closePostDetail = function closePostDetail() {
    const modal = document.getElementById('postDetailModal');
    if (!modal) {
      return;
    }
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.innerHTML = '';
    }, 250);
  };

  // --------------------------->
  // 전역: 게시글 수정 모달 닫기 (AJAX 모달용)
  // --------------------------->
  window.closePostEdit = function closePostEdit() {
    const modal = document.getElementById('postEditModal');
    if (!modal) {
      return;
    }
    
    // PostEdit 모드 비활성화 (원본 함수들 복원)
    if (window.PostEdit && typeof window.PostEdit.restore === 'function') {
      window.PostEdit.restore();
    }
    
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.innerHTML = '';
    }, 250);
  };

  // --------------------------->
  // 주의: 좋아요 기능은 like_manager.js에서 전역으로 처리됨
  // 중복 바인딩 방지를 위해 별도 로직 제거
  // --------------------------->
  // window.PostListManager.toggleLike 제거됨 - like_manager.js 사용

  // --------------------------->
  // 초기 바인딩(문서 로드 후)
  // --------------------------->
  document.addEventListener('DOMContentLoaded', () => {

    // (1) 필터 초기화 버튼
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const url = new URL(location.href);
        url.searchParams.delete('keyword');
        url.searchParams.delete('region');
        url.searchParams.set('sort', 'createdAt');
        url.searchParams.set('direction', 'desc');
        url.searchParams.set('page', '0');
        location.href = url.pathname + '?' + url.searchParams.toString();
      });
    }

    // (2) “게시글 작성” 버튼
    const writeBtn =
        document.querySelector('[data-action="open-post-modal"]') ||
        document.getElementById('openPostModal');
    if (writeBtn) {
      writeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.PostListManager.openPostModal();
      });
    }

    // (3) 카드/말풍선 버튼 → 상세 모달 열기 (data-action 지원)
    document.body.addEventListener('click', (e) => {
      const trigger = e.target.closest(
          '[data-action="open-detail"], [data-action="open-detail-comment"]');
      if (!trigger) {
        return;
      }
      e.preventDefault();

      const id =
          trigger.dataset.postId ||
          trigger.getAttribute('th:data-post-id') || // 혹시 잔존 th 속성
          trigger.closest('[data-post-id]')?.dataset.postId;

      if (!id) {
        return;
      }
      const focusComments = trigger.matches(
          '[data-action="open-detail-comment"]');
      window.openPostDetail(id, focusComments);
    });

    // (4) 좋아요 버튼은 like_manager.js에서 전역으로 자동 바인딩됨
    // 중복 바인딩 방지를 위해 여기서는 처리하지 않음

    // (5) 수정 후 리다이렉트 시 모달 열기
    const urlParams = new URLSearchParams(window.location.search);
    const postIdToOpen = urlParams.get('open');
    if (postIdToOpen) {
      window.openPostDetail(postIdToOpen);
      // URL에서 파라미터 제거하여 새로고침 시 다시 열리지 않도록 함
      const newUrl = window.location.pathname + window.location.search.replace(/&?open=\d+/, '');
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  });
})();