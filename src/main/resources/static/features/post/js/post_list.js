/**
 * 게시글 리스트 페이지 완전 관리 객체
 * 검색, 필터링, 페이지네이션, 뷰 모드 전환 등 모든 기능 담당
 */
const PostListManager = {
  // DOM 요소들
  elements: {
    searchForm: null,
    searchInput: null,
    clearSearchBtn: null,
    sortTabs: null,
    regionSelect: null,
    clearFiltersBtn: null,
    postsContainer: null,
    scrollTopBtn: null,
    loadingOverlay: null,
    mobilePostBtn: null
  },

  // 상태 관리
  state: {
    currentFilters: {
      keyword: '',
      region: '',
      sort: 'createdAt',
      direction: 'desc',
      page: 0
    },
    isLoading: false,
    searchDebounceTimer: null
  },

  // 설정값
  config: {
    debounceDelay: 300,
    scrollTopThreshold: 300,
    postsPerPage: 16, // 4x4 그리드
    maxRetries: 3
  },

  /**
   * 초기화 함수
   */
  init() {
    this.initElements();
    this.loadStateFromURL();
    this.bindEvents();
    this.initLazyLoading();
    this.initQuickActions();

    console.log('PostListManager: 초기화 완료');
  },

  /**
   * DOM 요소 초기화
   */
  initElements() {
    this.elements = {
      searchForm: document.getElementById('searchForm'),
      searchInput: document.getElementById('searchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      sortTabs: document.querySelectorAll('input[name="sort"]'),
      regionSelect: document.querySelector('.region-filter-select'),
      clearFiltersBtn: document.getElementById('clearFiltersBtn'),
      postsContainer: document.getElementById('postsContainer'),
      scrollTopBtn: document.getElementById('scrollToTopBtn'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      mobilePostBtn: document.getElementById('mobilePostBtn')
    };

    // 필수 요소 확인
    if (!this.elements.searchForm) {
      console.error('PostListManager: 필수 DOM 요소를 찾을 수 없습니다.');
      return false;
    }

    return true;
  },

  /**
   * URL에서 현재 상태 로드
   */
  loadStateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    this.state.currentFilters = {
      keyword: urlParams.get('keyword') || '',
      region: urlParams.get('region') || '',
      sort: urlParams.get('sort') || 'createdAt',
      direction: urlParams.get('direction') || 'desc',
      page: parseInt(urlParams.get('page')) || 0
    };

    console.log('PostListManager: URL 상태 로드됨', this.state.currentFilters);
  },

  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    // 검색 입력 이벤트
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      this.elements.searchInput.addEventListener('focus', (e) => {
        e.target.select();
      });

      // 검색어 지우기 버튼
      if (this.elements.clearSearchBtn) {
        this.elements.clearSearchBtn.addEventListener('click', () => {
          this.clearSearch();
        });
      }
    }

    // 폼 제출 이벤트
    if (this.elements.searchForm) {
      this.elements.searchForm.addEventListener('submit', (e) => {
        this.handleFormSubmit(e);
      });
    }

    // 정렬 탭 이벤트
    this.elements.sortTabs.forEach(tab => {
      tab.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.handleSortChange(e.target.value);
        }
      });
    });

    // 지역 필터 이벤트
    if (this.elements.regionSelect) {
      this.elements.regionSelect.addEventListener('change', (e) => {
        this.handleRegionChange(e.target.value);
      });
    }

    // 필터 초기화 버튼
    if (this.elements.clearFiltersBtn) {
      this.elements.clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // 모바일 게시글 작성 버튼
    if (this.elements.mobilePostBtn) {
      this.elements.mobilePostBtn.addEventListener('click', () => {
        this.openPostModal();
      });
    }

    // 브라우저 뒤로가기/앞으로가기
    window.addEventListener('popstate', (e) => {
      this.handlePopState(e);
    });

    // 키보드 단축키
    this.bindKeyboardShortcuts();

    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });
  },

  /**
   * 검색 입력 처리 (디바운스 적용)
   */
  handleSearchInput(value) {
    // 검색어 지우기 버튼 표시/숨김
    if (this.elements.clearSearchBtn) {
      this.elements.clearSearchBtn.style.display = value ? 'flex' : 'none';
    }

    // 기존 타이머 취소
    if (this.state.searchDebounceTimer) {
      clearTimeout(this.state.searchDebounceTimer);
    }

    // 디바운스 적용
    this.state.searchDebounceTimer = setTimeout(() => {
      if (value !== this.state.currentFilters.keyword) {
        this.state.currentFilters.keyword = value;
        this.state.currentFilters.page = 0;
        this.updateURL();
        this.submitSearch();
      }
    }, this.config.debounceDelay);
  },

  /**
   * 폼 제출 처리
   */
  handleFormSubmit(e) {
    e.preventDefault();
    this.updateFiltersFromForm();
    this.updateURL();
    this.submitSearch();
  },

  /**
   * 정렬 변경 처리
   */
  handleSortChange(sortValue) {
    if (this.state.currentFilters.sort !== sortValue) {
      this.state.currentFilters.sort = sortValue;
      this.state.currentFilters.page = 0;
      this.updateURL();
      this.submitSearch();
    }
  },

  /**
   * 지역 필터 변경 처리
   */
  handleRegionChange(regionValue) {
    if (this.state.currentFilters.region !== regionValue) {
      this.state.currentFilters.region = regionValue;
      this.state.currentFilters.page = 0;
      this.updateURL();
      this.submitSearch();
    }
  },

  /**
   * 폼에서 필터 값 업데이트
   */
  updateFiltersFromForm() {
    const formData = new FormData(this.elements.searchForm);

    this.state.currentFilters = {
      keyword: formData.get('keyword') || '',
      region: formData.get('region') || '',
      sort: formData.get('sort') || 'createdAt',
      direction: formData.get('direction') || 'desc',
      page: parseInt(formData.get('page')) || 0
    };
  },

  /**
   * URL 업데이트 (히스토리 관리)
   */
  updateURL() {
    const params = new URLSearchParams();

    Object.entries(this.state.currentFilters).forEach(([key, value]) => {
      if (value !== '' && value !== 0 &&
          !(key === 'sort' && value === 'createdAt') &&
          !(key === 'direction' && value === 'desc')) {
        params.set(key, value);
      }
    });

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;

    if (newURL !== window.location.pathname + window.location.search) {
      history.pushState(this.state.currentFilters, '', newURL);
    }
  },

  /**
   * 검색 실행
   */
  async submitSearch() {
    if (this.state.isLoading) return;

    this.showLoading(true);

    try {
      // 폼 제출 (서버 사이드 렌더링)
      this.elements.searchForm.submit();
    } catch (error) {
      console.error('PostListManager: 검색 실행 실패:', error);
      this.showToast('검색 중 오류가 발생했습니다.', 'error');
    } finally {
      this.showLoading(false);
    }
  },

  /**
   * 검색어 초기화
   */
  clearSearch() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
      this.elements.clearSearchBtn.style.display = 'none';
    }

    this.state.currentFilters.keyword = '';
    this.state.currentFilters.page = 0;

    this.updateURL();
    this.submitSearch();
  },

  /**
   * 모든 필터 초기화
   */
  clearAllFilters() {
    // 폼 초기화
    this.elements.searchForm.reset();

    // 상태 초기화
    this.state.currentFilters = {
      keyword: '',
      region: '',
      sort: 'createdAt',
      direction: 'desc',
      page: 0
    };

    // UI 업데이트
    if (this.elements.clearSearchBtn) {
      this.elements.clearSearchBtn.style.display = 'none';
    }

    this.updateURL();
    this.submitSearch();
  },

  /**
   * 특정 필터 제거
   */
  removeFilter(filterType) {
    switch (filterType) {
      case 'keyword':
        this.clearSearch();
        break;
      case 'region':
        if (this.elements.regionSelect) {
          this.elements.regionSelect.value = '';
        }
        this.handleRegionChange('');
        break;
    }
  },

  /**
   * 이미지 지연 로딩 초기화
   */
  initLazyLoading() {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;

          // 로딩 에러 처리
          img.addEventListener('error', () => {
            img.alt = '이미지를 불러올 수 없습니다';
            img.classList.add('error');
          });

          // 로딩 완료 처리
          img.addEventListener('load', () => {
            img.classList.add('loaded');
          });

          imageObserver.unobserve(img);
        }
      });
    }, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });

    // 현재 이미지들에 observer 적용
    const lazyImages = document.querySelectorAll('.post-image[loading="lazy"]');
    lazyImages.forEach(img => imageObserver.observe(img));

    console.log(`PostListManager: ${lazyImages.length}개 이미지에 지연 로딩 적용`);
  },

  /**
   * 빠른 액션 버튼 초기화
   */
  initQuickActions() {
    // 좋아요 버튼 이벤트
    document.addEventListener('click', (e) => {
      if (e.target.closest('.like-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.like-btn');
        const postId = btn.dataset.postId;
        if (postId) {
          this.toggleLike(postId, btn);
        }
      }
    });
  },

  /**
   * 좋아요 토글
   */
  async toggleLike(postId, buttonElement) {
    if (!postId || this.state.isLoading) return;

    const originalState = buttonElement.classList.contains('active');

    // 즉시 UI 업데이트 (낙관적 업데이트)
    buttonElement.classList.toggle('active');

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // 좋아요 개수 업데이트
        const likeCountElements = document.querySelectorAll(`[data-post-id="${postId}"] .stat-item:has([data-like-count])`);
        likeCountElements.forEach(el => {
          const countSpan = el.querySelector('[data-like-count]');
          if (countSpan) {
            countSpan.textContent = data.likeCount;
          }
        });

        console.log(`PostListManager: 좋아요 ${data.liked ? '추가' : '제거'} 완료`);
      } else {
        // 실패 시 원래 상태로 되돌리기
        buttonElement.classList.toggle('active', originalState);
        throw new Error('좋아요 처리 실패');
      }
    } catch (error) {
      // 오류 시 원래 상태로 되돌리기
      buttonElement.classList.toggle('active', originalState);
      console.error('PostListManager: 좋아요 처리 오류:', error);
      this.showToast('좋아요 처리 중 오류가 발생했습니다.', 'error');
    }
  },

  /**
   * 게시글로 이동 (댓글 포커스 옵션)
   */
  goToPost(postId, focusComment = false) {
    const url = `/posts/${postId}${focusComment ? '#comments' : ''}`;
    window.location.href = url;
  },

  /**
   * 게시글 공유
   */
  async sharePost(postId) {
    const postUrl = `${window.location.origin}/posts/${postId}`;

    // Web Share API 지원 확인
    if (navigator.share) {
      try {
        await navigator.share({
          title: '문화유산 게시글',
          text: '흥미로운 문화유산 게시글을 확인해보세요!',
          url: postUrl
        });

        console.log('PostListManager: 공유 완료');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('PostListManager: 공유 실패:', error);
          this.fallbackShare(postUrl);
        }
      }
    } else {
      this.fallbackShare(postUrl);
    }
  },

  /**
   * 폴백 공유 (클립보드 복사)
   */
  async fallbackShare(url) {
    try {
      await navigator.clipboard.writeText(url);
      this.showToast('링크가 클립보드에 복사되었습니다!', 'success');
    } catch (error) {
      console.error('PostListManager: 클립보드 복사 실패:', error);

      // 임시 input 요소를 사용한 폴백
      const tempInput = document.createElement('input');
      tempInput.value = url;
      document.body.appendChild(tempInput);
      tempInput.select();

      try {
        document.execCommand('copy');
        this.showToast('링크가 복사되었습니다!', 'success');
      } catch (e) {
        this.showToast('링크 복사에 실패했습니다.', 'error');
      }

      document.body.removeChild(tempInput);
    }
  },

  /**
   * 키보드 단축키 바인딩
   */
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: 검색 포커스
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (this.elements.searchInput) {
          this.elements.searchInput.focus();
        }
      }

      // ESC: 검색 초기화 (검색 입력에 포커스된 상태에서)
      if (e.key === 'Escape' && document.activeElement === this.elements.searchInput) {
        this.clearSearch();
      }

      // Ctrl/Cmd + Enter: 게시글 작성 모달 열기
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (window.PostModal) {
          window.PostModal.open();
        }
      }
    });
  },

  /**
   * 윈도우 리사이즈 처리
   */
  handleWindowResize() {
    // 모바일/데스크탑 전환 시 필요한 처리
    const isMobile = window.innerWidth <= 767;

    if (isMobile) {
      // 모바일 모드 처리
      if (this.elements.mobilePostBtn) {
        this.elements.mobilePostBtn.style.display = 'block';
      }
    } else {
      // 데스크탑 모드 처리
      if (this.elements.mobilePostBtn) {
        this.elements.mobilePostBtn.style.display = 'none';
      }
    }
  },

  /**
   * 브라우저 뒤로가기/앞으로가기 처리
   */
  handlePopState(e) {
    if (e.state) {
      this.state.currentFilters = e.state;
      this.updateFormFromState();
      this.submitSearch();
    }
  },

  /**
   * 상태에서 폼 값 업데이트
   */
  updateFormFromState() {
    // 검색 입력
    if (this.elements.searchInput) {
      this.elements.searchInput.value = this.state.currentFilters.keyword;
      this.elements.clearSearchBtn.style.display = this.state.currentFilters.keyword ? 'flex' : 'none';
    }

    // 정렬 탭
    this.elements.sortTabs.forEach(tab => {
      tab.checked = tab.value === this.state.currentFilters.sort;
    });

    // 지역 선택
    if (this.elements.regionSelect) {
      this.elements.regionSelect.value = this.state.currentFilters.region;
    }

    // 숨겨진 필드들
    const hiddenFields = this.elements.searchForm.querySelectorAll('input[type="hidden"]');
    hiddenFields.forEach(field => {
      const fieldName = field.name;
      if (this.state.currentFilters[fieldName] !== undefined) {
        field.value = this.state.currentFilters[fieldName];
      }
    });
  },

  /**
   * 로딩 상태 표시/숨김
   */
  showLoading(show) {
    this.state.isLoading = show;

    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.toggle('show', show);
    }

    // 버튼들 비활성화
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    buttons.forEach(btn => {
      btn.disabled = show;
    });
  },

  /**
   * 토스트 메시지 표시
   */
  showToast(message, type = 'info') {
    if (typeof window.toastManager !== 'undefined') {
      window.toastManager.show(message, type);
    } else {
      // 폴백: 간단한 알림
      const alertPrefix = {
        success: '✅ ',
        error: '❌ ',
        warning: '⚠️ ',
        info: 'ℹ️ '
      };

      alert((alertPrefix[type] || '') + message);
    }
  },

  /**
   * 현재 필터 상태 반환
   */
  getCurrentFilters() {
    return { ...this.state.currentFilters };
  },

  /**
   * 특정 필터 값 설정
   */
  setFilter(filterName, filterValue) {
    if (this.state.currentFilters.hasOwnProperty(filterName)) {
      this.state.currentFilters[filterName] = filterValue;
      this.updateFormFromState();
      this.updateURL();
      this.submitSearch();
    }
  },

  /**
   * 게시글 카드 애니메이션 효과
   */
  initCardAnimations() {
    const cards = document.querySelectorAll('.post-card');

    // Intersection Observer로 카드 등장 애니메이션
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, index * 50); // 순차적 등장 효과

          cardObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    cards.forEach(card => cardObserver.observe(card));
  },

  /**
   * 게시글 작성 모달 열기
   */
  openPostModal() {
    if (!document.getElementById('postModal')) {
      alert('로그인이 필요합니다.');
      location.href = '/auth/login';
      return;
    }
    // PostModal 전역 초기화 보장
    if (window.PostModal && window.PostModal.modal) {
      window.PostModal.open();
    } else if (window.PostModal) {
      window.PostModal.init();
      if (window.PostModal.modal) window.PostModal.open();
      else alert('모달 준비 중입니다. 새로고침 후 시도해주세요.');
    } else {
      alert('모달 스크립트가 로드되지 않았습니다.');
    }
  },

  /**
   * 리소스 정리
   */
  destroy() {
    // 타이머 정리
    if (this.state.searchDebounceTimer) {
      clearTimeout(this.state.searchDebounceTimer);
    }

    // 이벤트 리스너 제거는 브라우저가 자동으로 처리
    console.log('PostListManager: 리소스 정리 완료');
  }
};

/**
 * 레거시 함수들 (기존 HTML에서 사용)
 */

// 폼 제출 (셀렉트 박스 변경 시)
function submitForm() {
  if (PostListManager.elements.searchForm) {
    PostListManager.elements.searchForm.submit();
  }
}

// 필터 제거
function removeFilter(filterType) {
  PostListManager.removeFilter(filterType);
}

// 게시글로 이동
function goToPost(postId, focusComment = false) {
  PostListManager.goToPost(postId, focusComment);
}

// 게시글 공유
function sharePost(postId) {
  PostListManager.sharePost(postId);
}

/**
 * 페이지 로드 시 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
  PostListManager.init();

  // 카드 애니메이션 초기화 (선택사항)
  PostListManager.initCardAnimations();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  PostListManager.destroy();
});

// 전역 객체로 노출
window.PostListManager = PostListManager;
window.submitForm = submitForm;
window.removeFilter = removeFilter;
window.goToPost = goToPost;
window.sharePost = sharePost;