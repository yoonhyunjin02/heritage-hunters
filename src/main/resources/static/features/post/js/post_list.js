// features/post/js/post_list.js
window.PostListManager = window.PostListManager || {};
var PostListManager = window.PostListManager; // 전역 식별자 바인딩 추가

// 이벤트 위임으로 클릭 이벤트 처리
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  
  const action = target.getAttribute('data-action');
  const postId = target.getAttribute('data-post-id');
  
  switch (action) {
    case 'open-detail':
      if (postId) {
        e.preventDefault();
        window.openPostDetail(parseInt(postId));
      }
      break;
    case 'open-detail-comment':
      if (postId) {
        e.preventDefault();
        window.openPostDetail(parseInt(postId), true);
      }
      break;
    case 'open-post-modal':
      e.preventDefault();
      PostListManager.openPostModal();
      break;
  }
});

/** 정렬/필터 변경 시 전송 */
window.submitForm = () => {
  const f = document.getElementById('searchForm');
  if (f) f.submit();
};

/** 필터 초기화 */
(() => {
  const btn = document.getElementById('clearFiltersBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const url = new URL(location.href);
    url.searchParams.delete('keyword');
    url.searchParams.delete('region');
    url.searchParams.set('sort', 'createdAt');
    url.searchParams.set('direction', 'desc');
    url.searchParams.set('page', '0');
    location.href = url.pathname + '?' + url.searchParams.toString();
  });
})();

/** 게시글 작성 모달 (있을 때만 위임) */
PostListManager.openPostModal = () => {
  if (window.PostModal && typeof window.PostModal.open === 'function') {
    window.PostModal.open();
  } else {
    // fallback: 모달 트리거가 있다면 클릭
    const t = document.querySelector('[data-open-post-modal]');
    if (t) t.click();
  }
};

// 현재 로딩 중인 게시글과 캐시된 데이터를 추적
const loadingPosts = new Set();
const postDataCache = new Map();

/** 게시글 상세 모달 열기 */
window.openPostDetail = async (postId, focusComments = false) => {
  // 이미 로딩 중이면 중복 요청 방지
  if (loadingPosts.has(postId)) {
    return;
  }
  
  // DOM이 완전히 로드될 때까지 대기
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.openPostDetail(postId, focusComments);
    });
    return;
  }
  
  let modal = document.getElementById('postDetailModal');
  if (!modal) {
    // 모달이 없으면 기존 방식으로 페이지 이동
    window.location.href = `/posts/${postId}`;
    return;
  }

  try {
    // 로딩 상태 설정
    loadingPosts.add(postId);
    
    // 로딩 표시
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.innerHTML = '<div class="modal-content modal-loading"><div class="loading-spinner"></div><p>게시글을 불러오는 중...</p></div>';
    
    let html;
    
    // 캐시된 데이터가 있으면 사용
    if (postDataCache.has(postId)) {
      html = postDataCache.get(postId);
    } else {
      // 첫 번째 요청 시에만 서버에서 데이터 가져오기
      const response = await fetch(`/posts/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to load post');
      }
      
      html = await response.text();
      // 캐시에 저장
      postDataCache.set(postId, html);
    }
    
    // HTML에서 모달 내용만 추출
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const modalContent = doc.querySelector('#postDetailModal .modal-content');
    
    if (modalContent) {
      modal.innerHTML = '';
      modal.appendChild(modalContent.cloneNode(true));
      
      // 댓글로 포커스 이동
      if (focusComments) {
        setTimeout(() => {
          const commentInput = modal.querySelector('#commentTextarea');
          if (commentInput) {
            commentInput.focus();
            commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
      
      // 게시글 상세 기능 초기화
      initModalContent();
      
    } else {
      throw new Error('Modal content not found');
    }
    
  } catch (error) {
    modal.style.display = 'flex';
    modal.innerHTML = '<div class="modal-content modal-error">게시글을 불러올 수 없습니다.</div>';
  } finally {
    // 로딩 상태 해제
    loadingPosts.delete(postId);
  }
};

/** 모달 내용 초기화 (이미지 갤러리, 댓글 등) */
function initModalContent() {
  const modal = document.getElementById('postDetailModal');
  
  // 게시글 상세 초기화 함수 직접 호출 (이미 스크립트가 로드되어 있음)
  if (typeof window.initializePostDetail === 'function') {
    window.initializePostDetail();
  }
  
  // 좋아요 매니저 재초기화 (모달 내부 버튼만)
  if (window.likeManager && modal) {
    const modalButtons = modal.querySelectorAll('.like-button');
    modalButtons.forEach(button => {
      // 기존 이벤트 리스너 제거
      if (button._likeHandler) {
        button.removeEventListener('click', button._likeHandler);
      }
      
      // 새 이벤트 리스너 추가
      button._likeHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.likeManager.toggleLike(button, true);
      };
      button.addEventListener('click', button._likeHandler);
    });
  }
  
  // 모달 이벤트 리스너 재설정
  if (modal && window.initModal) {
    window.initModal();
  }
}

/** 공통 모달 닫기 함수 */
function closeModal(modalId, clearContent = true) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('closing');
    
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('closing');
      if (clearContent) {
        modal.innerHTML = '';
      }
    }, 200); // CSS 애니메이션 시간과 맞춤
  }
}

/** 게시글 상세 모달 닫기 */
window.closePostDetail = () => {
  closeModal('postDetailModal', true);
};

/** 게시글 수정 모달 열기 */
window.openPostEdit = async (postId) => {
  // 이미 로딩 중이면 중복 요청 방지
  if (loadingPosts.has(postId)) {
    return;
  }
  
  // DOM이 완전히 로드될 때까지 대기
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.openPostEdit(postId);
    });
    return;
  }
  
  let modal = document.getElementById('postEditModal');
  if (!modal) {
    // 모달이 없으면 기존 방식으로 페이지 이동
    window.location.href = `/posts/${postId}/edit`;
    return;
  }

  try {
    // 로딩 상태 설정
    loadingPosts.add(postId);
    
    // 로딩 표시
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.innerHTML = '<div class="modal-content modal-loading"><div class="loading-spinner"></div><p>게시글을 불러오는 중...</p></div>';
    
    // 서버에서 수정 폼 데이터 가져오기
    const response = await fetch(`/posts/${postId}/edit`);
    if (!response.ok) {
      throw new Error('Failed to load post edit form');
    }
    
    const html = await response.text();
    
    // HTML에서 모달 내용만 추출
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const modalContent = doc.querySelector('#postEditModal .modal-content');
    
    if (modalContent) {
      modal.innerHTML = '';
      modal.appendChild(modalContent.cloneNode(true));
      
      // 수정 폼 기능 초기화
      initEditModalContent();
      
    } else {
      throw new Error('Edit modal content not found');
    }
    
  } catch (error) {
    modal.style.display = 'flex';
    modal.innerHTML = '<div class="modal-content modal-error">게시글 수정 폼을 불러올 수 없습니다.</div>';
  } finally {
    // 로딩 상태 해제
    loadingPosts.delete(postId);
  }
};

/** 게시글 수정 모달 닫기 */
window.closePostEdit = () => {
  closeModal('postEditModal', true);
};

/** 수정 모달 내용 초기화 */
function initEditModalContent() {
  const modal = document.getElementById('postEditModal');
  
  // 기존 수정 페이지 스크립트 초기화 (있다면)
  if (typeof window.initializePostEdit === 'function') {
    window.initializePostEdit();
  }
  
  // 모달 닫기 이벤트
  const closeButton = modal.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', window.closePostEdit);
  }
  
  // 취소 버튼 이벤트
  const cancelButton = modal.querySelector('[onclick="closePostEdit()"]');
  if (cancelButton) {
    cancelButton.addEventListener('click', window.closePostEdit);
  }
  
  // 폼 제출 후 처리
  const form = modal.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(e) {
      // 폼이 성공적으로 제출되면 모달을 닫고 페이지를 새로고침하거나 상세 페이지로 이동
      setTimeout(() => {
        window.closePostEdit();
        // 페이지 새로고침으로 업데이트된 내용 반영
        window.location.reload();
      }, 1000);
    });
  }
}

/** 좋아요 토글 (낙관적 업데이트) */
PostListManager.toggleLike = async (e, btn) => {
  e.preventDefault(); e.stopPropagation();
  const postId = btn.getAttribute('data-post-id');
  const wasLiked = btn.classList.contains('liked');

  try {
    await fetch(`/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
  } catch (_) {
    // 서버 실패해도 아래에서 원복 가능 (지금은 단순 낙관적 처리)
  } finally {
    // 버튼 자체 카운트
    const countEl = btn.querySelector('.like-count');
    const cur = parseInt(countEl?.textContent || '0', 10);
    const next = Math.max(0, cur + (wasLiked ? -1 : 1));
    if (countEl) countEl.textContent = String(next);

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
