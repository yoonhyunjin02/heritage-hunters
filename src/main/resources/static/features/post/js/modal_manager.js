/**
 * 공통 모달 관리자
 * 모든 모달의 열기/닫기 기능을 통합 관리
 */

// 모달 닫기 공통 함수
function closeModal(modalId, shouldNavigate = false, redirectUrl = '/posts') {
  const modal = document.getElementById(modalId);
  if (!modal) {
    if (shouldNavigate) {
      window.location.href = redirectUrl;
    }
    return;
  }

  // 이미 닫히는 중이면 무시
  if (modal.classList.contains('closing')) {
    return;
  }

  // 닫기 애니메이션 시작
  modal.classList.add('closing');
  modal.style.animation = 'modalSlideOut 0.3s ease-out forwards';
  
  // 애니메이션 완료 후 처리
  setTimeout(() => {
    modal.classList.remove('show', 'closing');
    modal.style.display = 'none';
    modal.style.animation = '';
    
    // shouldNavigate가 true일 때만 페이지 이동
    if (shouldNavigate) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = redirectUrl;
      }
    }
    // false일 때는 모달창만 닫고 페이지는 그대로 유지
  }, 300);
}

// 게시글 상세 모달 닫기
function closePostDetail() {
  closeModal('postDetailModal', false, '/posts');
}

// 게시글 수정 모달 닫기
function closePostEdit() {
  const modal = document.getElementById('postEditModal');
  if (modal) {
    // PostEdit 모드 비활성화 (원본 함수들 복원)
    if (window.PostEdit && typeof window.PostEdit.restore === 'function') {
      window.PostEdit.restore();
    }
    
    // 모달인 경우 - 다른 모달들처럼 닫기만 하고 페이지는 그대로 유지
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.innerHTML = '';
    }, 250);
  }
}

// 게시글 작성 모달 닫기
function closePostWrite() {
  closeModal('postModal', false, '/posts');
}

// ESC 키로 모달 닫기 공통 처리
function initModalKeyboardHandlers() {
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // 현재 열린 모달 찾기
      const openModal = document.querySelector('.modal.show, .modal:not([style*="display: none"])');
      if (openModal) {
        const modalId = openModal.id;
        switch(modalId) {
          case 'postDetailModal':
            closePostDetail();
            break;
          case 'postEditModal':
            closePostEdit();
            break;
          case 'postModal':
            closePostWrite();
            break;
        }
      }
    }
  });
}

// 모달 배경 클릭으로 닫기 공통 처리
function initModalBackgroundHandlers() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      const modalId = e.target.id;
      switch(modalId) {
        case 'postDetailModal':
          closePostDetail();
          break;
        case 'postEditModal':
          closePostEdit();
          break;
        case 'postModal':
          closePostWrite();
          break;
      }
    }
  });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  initModalKeyboardHandlers();
  initModalBackgroundHandlers();
});

// 전역 함수로 내보내기
window.closeModal = closeModal;
window.closePostDetail = closePostDetail;
window.closePostEdit = closePostEdit;
window.closePostWrite = closePostWrite;