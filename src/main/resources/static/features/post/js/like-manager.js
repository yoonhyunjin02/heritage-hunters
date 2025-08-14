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
     * 좋아요 토글 (AJAX 방식)
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

        // 중복 클릭 방지
        if (button.disabled) return;
        button.disabled = true;

        try {
            if (useAjax) {
                await this.handleAjaxLike(button, postId);
            } else {
                this.handleFormSubmit(button, postId);
            }
        } catch (error) {
            console.error('좋아요 처리 중 오류:', error);
            this.showError('좋아요 처리 중 오류가 발생했습니다.');
        } finally {
            button.disabled = false;
        }
    }

    /**
     * AJAX 방식 좋아요 처리
     */
    async handleAjaxLike(button, postId) {
        const response = await fetch(`/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                [this.csrfHeader]: this.csrfToken,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // JSON 응답 처리
                const result = await response.json();
                this.updateUI(button, result.liked, result.likeCount);
            } else {
                // HTML 응답인 경우 현재 상태 기반으로 토글
                const isCurrentlyLiked = button.classList.contains('liked');
                const currentCount = this.getCurrentLikeCount(button);
                
                const newLiked = !isCurrentlyLiked;
                const newCount = newLiked ? currentCount + 1 : currentCount - 1;
                
                this.updateUI(button, newLiked, newCount);
            }
        } else if (response.status === 401) {
            this.showError('로그인이 필요합니다.');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } else {
            throw new Error(`HTTP ${response.status}`);
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
     * 모든 좋아요 버튼에 이벤트 리스너 추가
     */
    initializeLikeButtons(useAjax = true) {
        const likeButtons = document.querySelectorAll('.like-button, .icon-action[title*="좋아요"]');
        
        likeButtons.forEach(button => {
            // 기존 이벤트 리스너 제거
            button.removeEventListener('click', this.handleLikeClick);
            
            // 새 이벤트 리스너 추가
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                this.toggleLike(button, useAjax);
            });
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