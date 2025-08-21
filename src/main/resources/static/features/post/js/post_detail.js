// 상세 보기 전역 함수들
(function () {
  // 상태
  let images = [];
  let current = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initializePostDetail();
    initializeRelativeTime();
    initializeCommentForm();
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
    const modal = document.getElementById('postDetailModal');
    const imageOrderStr = modal?.dataset.imageOrder; // 서버에서 제공하는 이미지 순서 (예: "id1,id2,id3")
    const orderedImageIds = imageOrderStr ? imageOrderStr.split(',') : [];

    const thumbs = document.querySelectorAll('.thumb img');
    const main = document.getElementById('mainImage');

    let tempImages = [];
    if (thumbs.length) {
      // DOM에서 현재 이미지 정보 수집 (ID를 포함하여)
      const domImages = Array.from(thumbs).map((img, i) => {
        const thumb = img.closest('.thumb');
        return {
          url: img.dataset.full || img.src,
          alt: img.alt || `이미지 ${i + 1}`,
          id: thumb?.dataset.imageId // 썸네일 요소에 이미지 ID가 있다고 가정
        };
      });

      // orderedImageIds를 기반으로 이미지 배열 재정렬
      if (orderedImageIds.length > 0) {
        orderedImageIds.forEach(id => {
          const found = domImages.find(img => img.id === id);
          if (found) {
            tempImages.push(found);
          }
        });
        // 순서에 포함되지 않은 이미지 (새로 추가되었지만 아직 ID가 없는 경우 등)는 뒤에 추가
        domImages.forEach(img => {
          if (!tempImages.some(ti => ti.id === img.id)) {
            tempImages.push(img);
          }
        });
      } else {
        // 순서 정보가 없으면 DOM 순서 그대로 사용
        tempImages = domImages;
      }
    } else if (main?.src) {
      tempImages = [{url: main.src, alt: '이미지 1'}];
    } else {
      tempImages = [];
    }

    images = tempImages; // 전역 images 배열 업데이트
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
   * - 페이지 내 모든 .modal-dropdown-menu 요소에서 'show' 클래스 제거
   * - 다른 드롭다운 열기 전 정리 작업에 사용
   */
  function closeAllDropdowns() {
    document.querySelectorAll('.modal-dropdown-menu').forEach(
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
    tx.scrollIntoView({behavior: 'smooth', block: 'center'});
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
   * - AJAX 모달인 경우: modal_manager의 closePostDetail 사용
   * - SSR 상세 페이지인 경우: 게시글 목록으로 이동
   * - 모달 요소가 있으면 닫기 애니메이션 적용 후 페이지 이동
   */
  function closeModal() {
    const modal = document.getElementById('postDetailModal');
    
    // AJAX 모달인지 확인 (data-ajax-modal 속성이나 특정 클래스로 구분)
    if (modal && modal.style.display !== 'none' && modal.classList.contains('show')) {
      // AJAX 모달인 경우 - modal_manager의 closePostDetail 직접 호출하지 않고 직접 처리
      modal.classList.add('closing');
      modal.style.animation = 'modalSlideOut 0.3s ease-out forwards';
      
      setTimeout(() => {
        modal.classList.remove('show', 'closing');
        modal.style.display = 'none';
        modal.style.animation = '';
      }, 300);
      return;
    }

    // 단독 상세 페이지면 목록으로 이동
    if (!modal) {
      window.location.href = '/posts';
      return;
    }
    
    // 단독 페이지에서 모달이 있는 경우
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

      // post_edit.js 스크립트 동적 로드 및 초기화
      const scriptSrc = '/features/post/js/post_edit.js';
      const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);

      const initialize = () => {
        if (typeof window.initializePostEdit === 'function') {
          window.initializePostEdit();
        } else {
          console.error('initializePostEdit function not found.');
        }
      };

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.defer = true;
        script.onload = initialize;
        document.head.appendChild(script);
      } else {
        // 이미 스크립트가 로드된 경우, DOM이 준비된 후 초기화 함수를 호출
        setTimeout(initialize, 0);
      }

    } catch (err) {
      console.error('openPostEdit 오류:', err);
      // 실패 시 기존 방식으로 폴백
      window.location.href = `/posts/${targetId}/edit`;
    }
  }

  /**
   * 댓글 폼 AJAX 제출 처리를 초기화합니다.
   * 
   * @description
   * - 댓글 폼 제출 시 AJAX로 처리하여 페이지 리로드 방지
   * - 성공 시 댓글 목록 업데이트 및 토스트 메시지 표시
   * - 실패 시 에러 메시지 표시
   */
  function initializeCommentForm() {
    const commentForm = document.getElementById('commentForm');
    if (!commentForm) {
      return;
    }

    console.log('댓글 폼 AJAX 이벤트 리스너 등록됨');
    
    // 중복 제출 방지를 위한 상태 관리
    let isSubmitting = false;
    
    // 폼 제출 이벤트
    commentForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('댓글 폼 AJAX 제출 시작');
      await handleCommentSubmit();
    });

    // Enter 키 이벤트 (댓글 입력창)
    const commentTextarea = document.getElementById('commentTextarea');
    if (commentTextarea) {
      commentTextarea.addEventListener('keydown', async (evt) => {
        if (evt.key === 'Enter' && !evt.shiftKey && !evt.ctrlKey) {
          evt.preventDefault();
          await handleCommentSubmit();
        }
      });
    }

    // 댓글 제출 처리 함수
    async function handleCommentSubmit() {
      // 중복 제출 방지
      if (isSubmitting) {
        console.log('댓글 제출 중... 중복 요청 무시됨');
        return;
      }
      
      const formData = new FormData(commentForm);
      const postId = getPostId();
      
      if (!postId) {
        alert('게시글 ID를 찾을 수 없습니다.');
        return;
      }

      // 댓글 내용 검증
      const textarea = document.getElementById('commentTextarea');
      if (!textarea || !textarea.value.trim()) {
        alert('댓글 내용을 입력해주세요.');
        textarea?.focus();
        return;
      }

      // 제출 상태 설정 및 UI 비활성화
      isSubmitting = true;
      const submitButton = commentForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '등록 중...';
      }
      if (textarea) {
        textarea.disabled = true;
      }

      try {
        const response = await fetch(`/posts/${postId}/comments`, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (response.ok) {
          console.log('댓글 등록 성공');
          // 댓글 입력창 초기화
          if (textarea) {
            textarea.value = '';
            updateCharCount(textarea);
          }

          // 모달을 유지하면서 댓글 목록 및 개수 업데이트
          await refreshComments(postId);
          
          // 게시글 리스트의 댓글 개수도 동기화
          updatePostListCommentCount(postId);
          
          // 게시글 모달 캐시 무효화 (다음 방문 시 최신 댓글 표시)
          invalidatePostCache(postId);
          
          // 토스트 메시지 표시
          showToastMessage('success', '댓글이 등록되었습니다.');
        } else {
          console.error('댓글 등록 실패:', response.status, response.statusText);
          throw new Error('댓글 등록에 실패했습니다.');
        }
      } catch (error) {
        console.error('댓글 등록 오류:', error);
        showToastMessage('error', '댓글 등록에 실패했습니다.');
      } finally {
        // 제출 상태 해제 및 UI 활성화
        isSubmitting = false;
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = '등록';
        }
        if (textarea) {
          textarea.disabled = false;
          textarea.focus(); // 포커스 복원
        }
      }
    }

    // 댓글 글자 수 카운터 초기화
    const textarea = document.getElementById('commentTextarea');
    if (textarea) {
      textarea.addEventListener('input', function() {
        updateCharCount(this);
      });
    }
  }

  /**
   * 현재 게시글 ID를 가져옵니다.
   */
  function getPostId() {
    const modal = document.getElementById('postDetailModal');
    let postId = modal?.dataset.postId || modal?.getAttribute('data-post-id');
    
    // 모달에서 찾지 못한 경우 URL에서 추출
    if (!postId) {
      const urlPath = window.location.pathname;
      const match = urlPath.match(/\/posts\/(\d+)/);
      postId = match ? match[1] : null;
    }
    
    return postId;
  }

  /**
   * 게시글 리스트의 댓글 개수를 업데이트합니다.
   */
  function updatePostListCommentCount(postId) {
    try {
      // 현재 모달의 댓글 개수 가져오기
      const modal = document.getElementById('postDetailModal');
      if (!modal) return;
      
      const commentsList = modal.querySelector('.comments-list');
      if (!commentsList) return;
      
      // 실제 댓글 아이템 개수 세기 (.no-comments 제외)
      const commentItems = commentsList.querySelectorAll('.comment-item');
      const newCommentCount = commentItems.length;
      
      // 게시글 리스트에서 해당 카드 찾기
      const postCards = document.querySelectorAll(`.post-card[data-post-id="${postId}"]`);
      
      postCards.forEach(card => {
        // 댓글 개수 업데이트 (댓글이라는 텍스트가 포함된 stat 요소)
        const commentStats = Array.from(card.querySelectorAll('.stat')).filter(stat => 
          stat.textContent.includes('댓글')
        );
        
        commentStats.forEach(stat => {
          const commentCountElement = stat.querySelector('b');
          if (commentCountElement) {
            commentCountElement.textContent = newCommentCount;
          }
        });
      });
      
      console.log(`게시글 ${postId}의 리스트 댓글 개수가 ${newCommentCount}개로 업데이트됨`);
    } catch (error) {
      console.error('게시글 리스트 댓글 개수 업데이트 오류:', error);
    }
  }

  /**
   * 게시글 모달 캐시 무효화
   */
  function invalidatePostCache(postId) {
    try {
      if (window.PostListManager && typeof window.PostListManager.clearPostCache === 'function') {
        window.PostListManager.clearPostCache(postId);
        console.log(`✅ 게시글 ${postId} 캐시 무효화 완료 (댓글 변경)`);
      }
    } catch (error) {
      console.error('❌ 게시글 캐시 무효화 실패:', error);
    }
  }

  /**
   * 댓글 목록을 새로고침합니다.
   */
  async function refreshComments(postId) {
    try {
      console.log('댓글 목록 새로고침 시작, postId:', postId);
      const response = await fetch(`/posts/${postId}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        console.log('댓글 목록 새로고침 성공');
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        // 댓글 목록 업데이트
        const newCommentsList = doc.querySelector('.comments-list');
        if (newCommentsList) {
          const currentCommentsList = document.querySelector('#postDetailModal .comments-list');
          if (currentCommentsList) {
            currentCommentsList.innerHTML = newCommentsList.innerHTML;
          }
        }
        
        // 댓글 개수 업데이트 (모달 내부의 통계 영역)
        const newStatsSection = doc.querySelector('.stats');
        if (newStatsSection) {
          const currentStatsSection = document.querySelector('#postDetailModal .stats');
          if (currentStatsSection) {
            // 댓글이라는 텍스트가 포함된 stat 요소 찾기
            const newCommentStats = Array.from(newStatsSection.querySelectorAll('.stat')).filter(stat => 
              stat.textContent.includes('댓글')
            );
            const currentCommentStats = Array.from(currentStatsSection.querySelectorAll('.stat')).filter(stat => 
              stat.textContent.includes('댓글')
            );
            
            // 댓글 개수 동기화
            newCommentStats.forEach((newStat, index) => {
              if (currentCommentStats[index]) {
                currentCommentStats[index].innerHTML = newStat.innerHTML;
              }
            });
          }
        }
        
        // 상대시간 업데이트
        initializeRelativeTime();
      }
    } catch (error) {
      console.error('댓글 목록 새로고침 오류:', error);
    }
  }

  /**
   * 글자 수 카운터를 업데이트합니다.
   */
  function updateCharCount(textarea) {
    const charCount = document.getElementById('commentCharCount');
    if (charCount) {
      charCount.textContent = textarea.value.length;
    }
  }

  /**
   * 토스트 메시지를 표시합니다.
   */
  function showToastMessage(type, message) {
    // 기존 토스트가 있으면 제거
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
      existingToast.remove();
    }

    // 새 토스트 생성
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.className = `toast toast-${type}`;
    
    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${iconMap[type] || '📢'}</span>
        <span class="toast-text">${message}</span>
      </div>
      <button type="button" class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // 애니메이션 적용
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // 자동 제거
    setTimeout(() => {
      toast.remove();
    }, 3000);
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
  window.initializeCommentForm = initializeCommentForm;
})();
