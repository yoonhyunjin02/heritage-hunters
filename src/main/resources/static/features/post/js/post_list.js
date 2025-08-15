// features/post/js/post_list.js
// 모든 공개 함수는 전역에 노출(window.*)하여 템플릿의 inline 핸들러가 바로 쓸 수 있게 한다.

(function () {
  // --- 상태 캐시 ---
  const loadingPosts = new Set();
  const postDataCache = new Map();

  // ---------------------------
  // 전역: 검색/정렬/필터 submit
  // ---------------------------
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

  // ---------------------------
  // 전역 네임스페이스
  // ---------------------------
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
      if (postId && postDataCache.has(postId)) {
        postDataCache.delete(postId);
        console.log(`게시글 ${postId} 캐시가 무효화되었습니다.`);
      }
    } catch (e) {
      console.error('clearPostCache 오류:', e);
    }
  };

  // ---------------------------
  // 전역: 게시글 상세 모달 열기 (카드/댓글 버튼에서 inline 호출 가능)
  // ---------------------------
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

      // 캐시 사용 또는 서버에서 로드
      let html;
      if (postDataCache.has(postId)) {
        html = postDataCache.get(postId);
      } else {
        const res = await fetch(`/posts/${postId}`,
            {headers: {'X-Requested-With': 'XMLHttpRequest'}});
        if (!res.ok) {
          throw new Error('Failed to load post');
        }
        html = await res.text();
        postDataCache.set(postId, html);
      }

      // 모달 콘텐츠만 추출
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const content = doc.querySelector('#postDetailModal .modal-content');
      if (!content) {
        throw new Error('Modal content not found');
      }

      modal.innerHTML = '';
      modal.appendChild(content.cloneNode(true));

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

      // 상세 스크립트 초기화(이미 로드돼 있다고 가정)
      if (typeof window.initializePostDetail === 'function') {
        window.initializePostDetail();
      }

      // 좋아요 버튼 재바인딩 (모달 내부)
      if (window.likeManager) {
        modal.querySelectorAll('.like-button').forEach((btn) => {
          if (btn._like) {
            btn.removeEventListener('click', btn._like);
          }
          btn._like = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.likeManager.toggleLike(btn, true);
          };
          btn.addEventListener('click', btn._like);
        });
      }

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

  // ---------------------------
  // 전역: 게시글 상세 모달 닫기 (AJAX 모달용)
  // ---------------------------
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

  // ---------------------------
  // 전역: 게시글 수정 모달 닫기 (AJAX 모달용)
  // ---------------------------
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

  // ---------------------------
  // 전역: 카드 하단 좋아요 토글(낙관적 업데이트)
  // ---------------------------
  window.PostListManager.toggleLike = async function toggleLike(e, btn) {
    e.preventDefault();
    e.stopPropagation();
    const postId = btn.getAttribute('data-post-id');
    const wasLiked = btn.classList.contains('liked');

    try {
      await fetch(`/posts/${postId}/like`, {
        method: 'POST',
        headers: {'X-Requested-With': 'XMLHttpRequest'}
      });
    } catch (_) {
      // 실패 시 아래에서 원복 가능 (지금은 단순 낙관 처리)
    } finally {
      // 버튼 카운트
      const countEl = btn.querySelector('.like-count');
      const cur = parseInt(countEl?.textContent || '0', 10);
      const next = Math.max(0, cur + (wasLiked ? -1 : 1));
      if (countEl) {
        countEl.textContent = String(next);
      }

      // 상태 토글
      btn.classList.toggle('liked', !wasLiked);
      btn.setAttribute('aria-pressed', String(!wasLiked));

      // 카드 하단 표시행 동기화
      const card = btn.closest('.post-card');
      const bottom = card?.querySelector('.likes-row .likes-count');
      if (bottom) {
        const bcur = parseInt(bottom.textContent || '0', 10);
        bottom.textContent = String(Math.max(0, bcur + (wasLiked ? -1 : 1)));
      }
    }
  };

  // ---------------------------
  // 초기 바인딩(문서 로드 후)
  // ---------------------------
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

    // (4) 카드 내 좋아요 버튼 (like_manager.js 연동)
    if (window.likeManager) {
      document.querySelectorAll('.like-button').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.likeManager.toggleLike(btn, true);
        });
      });
    }
  });
})();