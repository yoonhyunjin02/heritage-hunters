/**
 * 좋아요 기능 공통 모듈
 * 게시글 상세 및 리스트에서 공통으로 사용
 */

class LikeManager {
    constructor() {
        this.csrfToken = this.getCSRFToken();
        this.csrfHeader = this.getCSRFHeader();
    }

    // CSRF 토큰 가져오기
    getCSRFToken() {
        return document.querySelector('meta[name="_csrf"]')?.content;
    }

    getCSRFHeader() {
        return document.querySelector('meta[name="_csrf_header"]')?.content;
    }

    /**
     * 좋아요 토글 (낙관적 업데이트)
     * @param {HTMLElement} button - 클릭된 좋아요 버튼
     * @param {boolean} useAjax - AJAX 사용 여부 (기본값: true)
     */
    async toggleLike(button, useAjax = true) {
        const postId = button.getAttribute('data-post-id') || button.closest('[data-post-id]')?.getAttribute('data-post-id');
        
        if (!postId) {
            console.error('게시글 ID를 찾을 수 없습니다.');
            return;
        }

        if (!this.csrfToken || !this.csrfHeader) {
            console.error('CSRF 토큰을 찾을 수 없습니다.');
            return;
        }

        // 중복 클릭 방지 (짧은 시간동안만)
        if (button.disabled) return;
        button.disabled = true;

        if (useAjax) {
            // 1. 즉시 UI 업데이트 (낙관적 업데이트)
            this.performOptimisticUpdate(button);
            // 2. 백엔드 호출은 비동기로 (UI 블로킹 없음)
            this.handleAjaxLike(button, postId); // await 제거!
        } else {
            this.handleFormSubmit(button, postId);
        }
        
        // 300ms 후 버튼 재활성화 (연속 클릭 방지용)
        setTimeout(() => {
            button.disabled = false;
        }, 300);
    }

    /**
     * 낙관적 UI 업데이트 수행
     */
    performOptimisticUpdate(button) {
        const isCurrentlyLiked = button.classList.contains('liked');
        const currentCount = this.getCurrentLikeCount(button);
        
        const newLiked = !isCurrentlyLiked;
        const newCount = Math.max(0, newLiked ? currentCount + 1 : currentCount - 1);
        
        console.log(`낙관적 업데이트: ${isCurrentlyLiked ? '좋아요 취소' : '좋아요'} - ${currentCount} → ${newCount}`);
        
        // 현재 버튼 업데이트
        this.updateUI(button, newLiked, newCount);
        
        // 게시글 상세에서 좋아요를 눌렀을 때 리스트의 해당 게시글도 동기화
        this.syncWithPostList(button, newLiked, newCount);
    }

    /**
     * 게시글 리스트와 상세 간 좋아요 상태 동기화
     */
    syncWithPostList(currentButton, newLiked, newCount) {
        // 현재 게시글 ID 가져오기
        const postId = currentButton.getAttribute('data-post-id') || 
                      currentButton.closest('[data-post-id]')?.getAttribute('data-post-id');
        
        if (!postId) {
            console.log('게시글 ID를 찾을 수 없어 동기화 생략');
            return;
        }

        // 현재 버튼이 게시글 상세 모달에 있는지 확인
        const isInModal = currentButton.closest('#postDetailModal') !== null;
        
        if (isInModal) {
            // 게시글 상세에서 좋아요를 눌렀을 때 → 리스트의 해당 게시글 동기화
            this.updatePostListItem(postId, newLiked, newCount);
            console.log(`게시글 ${postId} 리스트 동기화: ${newLiked ? '좋아요' : '좋아요 취소'} ${newCount}개`);
        } else {
            // 게시글 리스트에서 좋아요를 눌렀을 때 → 열린 모달이 있다면 동기화
            this.updateModalIfOpen(postId, newLiked, newCount);
            console.log(`게시글 ${postId} 모달 동기화: ${newLiked ? '좋아요' : '좋아요 취소'} ${newCount}개`);
        }

        // 📌 중요: 게시글 상세 모달 캐시 무효화
        this.invalidatePostCache(postId);
    }

    /**
     * 게시글 상세 모달 캐시 무효화
     * 좋아요 상태 변경 시 캐시된 HTML에서 오래된 상태가 보이는 것을 방지
     */
    invalidatePostCache(postId) {
        try {
            // post_list.js의 PostListManager.clearPostCache 호출
            if (window.PostListManager && typeof window.PostListManager.clearPostCache === 'function') {
                window.PostListManager.clearPostCache(postId);
                console.log(`✅ 게시글 ${postId} 캐시 무효화 완료`);
            } else {
                console.warn('⚠️ PostListManager.clearPostCache 함수를 찾을 수 없습니다');
            }
        } catch (error) {
            console.error('❌ 게시글 캐시 무효화 실패:', error);
        }
    }

    /**
     * 게시글 리스트의 특정 게시글 좋아요 상태 업데이트
     */
    updatePostListItem(postId, isLiked, likeCount) {
        // 해당 게시글 카드 찾기
        const postCards = document.querySelectorAll(`.post-card[data-post-id="${postId}"]`);
        
        postCards.forEach(card => {
            // 좋아요 버튼 상태 업데이트
            const likeButton = card.querySelector('.like-button');
            if (likeButton) {
                if (isLiked) {
                    likeButton.classList.add('liked');
                    likeButton.setAttribute('aria-pressed', 'true');
                } else {
                    likeButton.classList.remove('liked');
                    likeButton.setAttribute('aria-pressed', 'false');
                }

                // SVG fill 속성 업데이트
                const path = likeButton.querySelector('svg path');
                if (path) {
                    path.setAttribute('fill', isLiked ? 'currentColor' : 'none');
                }
            }

            // 좋아요 개수 업데이트 (게시글 리스트의 통계 영역)
            const likeStatElements = card.querySelectorAll('.stat');
            likeStatElements.forEach(stat => {
                if (stat.textContent.includes('좋아요')) {
                    const bElement = stat.querySelector('b');
                    if (bElement) {
                        bElement.textContent = likeCount;
                    }
                }
            });
        });
    }

    /**
     * 열린 모달이 해당 게시글이면 좋아요 상태 업데이트
     */
    updateModalIfOpen(postId, isLiked, likeCount) {
        const modal = document.getElementById('postDetailModal');
        if (!modal || modal.style.display === 'none' || !modal.classList.contains('show')) {
            return; // 모달이 열려있지 않음
        }

        const modalPostId = modal.getAttribute('data-post-id') || modal.dataset.postId;
        if (modalPostId !== postId) {
            return; // 다른 게시글의 모달임
        }

        // 모달의 좋아요 버튼 업데이트
        const modalLikeButton = modal.querySelector('.like-button');
        if (modalLikeButton) {
            if (isLiked) {
                modalLikeButton.classList.add('liked');
                modalLikeButton.setAttribute('aria-pressed', 'true');
            } else {
                modalLikeButton.classList.remove('liked');
                modalLikeButton.setAttribute('aria-pressed', 'false');
            }

            // SVG fill 속성 업데이트
            const path = modalLikeButton.querySelector('svg path');
            if (path) {
                path.setAttribute('fill', isLiked ? 'currentColor' : 'none');
            }
        }

        // 모달의 좋아요 개수 업데이트
        const modalStats = modal.querySelector('.actions-box .stats');
        if (modalStats) {
            const statElements = modalStats.querySelectorAll('.stat');
            statElements.forEach(stat => {
                if (stat.textContent.includes('좋아요')) {
                    const bElement = stat.querySelector('b');
                    if (bElement) {
                        bElement.textContent = likeCount;
                    }
                }
            });
        }
    }

    /**
     * AJAX 방식 좋아요 처리 (백엔드 동기화용)
     */
    async handleAjaxLike(button, postId) {
        try {
            const response = await fetch(`/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    [this.csrfHeader]: this.csrfToken,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.ok) {
                console.log('백엔드 좋아요 처리 성공');
                // 성공 시에는 이미 낙관적으로 업데이트된 상태 유지
                // 필요시 서버 응답으로 정확한 카운트 동기화 가능
            } else if (response.status === 401) {
                // 인증 실패 시 UI 롤백 후 로그인 페이지 이동
                this.performOptimisticUpdate(button); // 롤백
                this.showError('로그인이 필요합니다.');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            } else {
                // 기타 에러 시 UI 롤백
                this.performOptimisticUpdate(button); // 롤백
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            // 네트워크 에러 등 시 UI 롤백
            this.performOptimisticUpdate(button); // 롤백
            console.error('좋아요 백엔드 처리 실패:', error);
            this.showError('좋아요 처리 중 오류가 발생했습니다.');
        }
    }

    /**
     * 폼 제출 방식 좋아요 처리
     */
    handleFormSubmit(button, postId) {
        // 기존 폼 제출 방식 (페이지 리로드)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/posts/${postId}/like`;
        
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = this.csrfHeader.replace('X-', '').toLowerCase();
        csrfInput.value = this.csrfToken;
        
        form.appendChild(csrfInput);
        document.body.appendChild(form);
        form.submit();
    }

    /**
     * 현재 좋아요 개수 가져오기
     */
    getCurrentLikeCount(button) {
        // 게시글 리스트에서 - 해당 카드의 좋아요 통계만
        const postCard = button.closest('.post-card');
        if (postCard) {
            const likeStatElement = postCard.querySelector('.stats .stat:first-child b');
            if (likeStatElement) {
                return parseInt(likeStatElement.textContent) || 0;
            }
        }

        // 게시글 상세에서 - 액션박스의 좋아요 통계만
        const actionsStats = document.querySelector('.actions-box .stats');
        if (actionsStats) {
            const statElements = actionsStats.querySelectorAll('.stat');
            for (let stat of statElements) {
                if (stat.textContent.includes('좋아요')) {
                    const bElement = stat.querySelector('b');
                    if (bElement) {
                        return parseInt(bElement.textContent) || 0;
                    }
                }
            }
        }

        return 0;
    }

    /**
     * UI 업데이트
     */
    updateUI(button, isLiked, likeCount) {
        // 버튼 상태 업데이트
        if (isLiked) {
            button.classList.add('liked');
            button.setAttribute('aria-pressed', 'true');
        } else {
            button.classList.remove('liked');
            button.setAttribute('aria-pressed', 'false');
        }

        // SVG fill 속성 업데이트
        const path = button.querySelector('svg path');
        if (path) {
            path.setAttribute('fill', isLiked ? 'currentColor' : 'none');
        }

        // 좋아요 개수 업데이트 (여러 위치에서 찾기)
        this.updateLikeCount(button, likeCount);
    }

    /**
     * 좋아요 개수 업데이트 (특정 게시글만)
     */
    updateLikeCount(button, likeCount) {
        // 게시글 리스트의 경우 - 해당 카드의 좋아요 수만 업데이트
        const postCard = button.closest('.post-card');
        if (postCard) {
            const likeStatElement = postCard.querySelector('.stats .stat:first-child b');
            if (likeStatElement) {
                likeStatElement.textContent = likeCount;
            }
            return;
        }

        // 게시글 상세의 경우 - 좋아요 통계만 업데이트 (정확한 선택)
        const detailStats = document.querySelector('.actions-box .stats');
        if (detailStats) {
            const statElements = detailStats.querySelectorAll('.stat');
            statElements.forEach(stat => {
                if (stat.textContent.includes('좋아요')) {
                    const bElement = stat.querySelector('b');
                    if (bElement) {
                        bElement.textContent = likeCount;
                    }
                }
            });
        }
    }


    /**
     * 에러 메시지 표시
     */
    showError(message) {
        // 토스트 메시지나 알림 표시
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * DOM 위임 패턴으로 좋아요 버튼 이벤트 처리
     * 동적으로 생성된 버튼들도 자동으로 처리됨
     */
    initializeLikeButtons(useAjax = true) {
        // 기존 직접 바인딩 방식 제거하고 DOM 위임 사용
        document.addEventListener('click', (e) => {
            // 좋아요 버튼인지 확인
            const button = e.target.closest('.like-button, .icon-action[title*="좋아요"]');
            if (!button) return;
            
            e.preventDefault();
            e.stopPropagation(); // 카드 클릭 이벤트 방지
            
            // 중복 클릭 방지
            if (button.disabled) return;
            
            this.toggleLike(button, useAjax);
        });
    }
}

// 전역 LikeManager 인스턴스 생성
window.likeManager = new LikeManager();

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.likeManager.initializeLikeButtons(true); // AJAX 방식 사용
});

// 전역 함수로 내보내기 (HTML onclick에서 사용)
window.toggleLike = function(button) {
    window.likeManager.toggleLike(button, true);
};