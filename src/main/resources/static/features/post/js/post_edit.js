document.addEventListener('DOMContentLoaded', function() {
    initializeEditForm();
});

function initializeEditForm() {
    setupImageHandling();
    setupCharCounters();
    setupFormValidation();
}

// 이미지 관련 기능
function setupImageHandling() {
    const imageInput = document.getElementById('imageInput');
    const uploadZone = document.querySelector('.upload-zone');
    const newImagePreview = document.getElementById('newImagePreview');

    if (!imageInput || !uploadZone || !newImagePreview) return;

    // 파일 선택 이벤트
    imageInput.addEventListener('change', function(e) {
        handleFileSelect(e.target.files);
    });

    // 드래그 앤 드롭
    uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    });
}

function handleFileSelect(files) {
    const newImagePreview = document.getElementById('newImagePreview');
    const maxFiles = 5;
    
    if (files.length > maxFiles) {
        alert(`최대 ${maxFiles}개의 이미지만 업로드할 수 있습니다.`);
        return;
    }

    newImagePreview.style.display = 'block';
    newImagePreview.innerHTML = '';

    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = createImagePreviewItem(e.target.result, index);
            newImagePreview.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

function createImagePreviewItem(src, index) {
    const div = document.createElement('div');
    div.className = 'image-preview-item';
    div.innerHTML = `
        <img src="${src}" alt="새 이미지 ${index + 1}">
        <button type="button" class="remove-image-btn" onclick="removeNewImage(${index})" aria-label="이미지 삭제">×</button>
    `;
    return div;
}

function removeNewImage(index) {
    const newImagePreview = document.getElementById('newImagePreview');
    const items = newImagePreview.querySelectorAll('.image-preview-item');
    if (items[index]) {
        items[index].remove();
    }
    
    // 모든 이미지가 제거되면 미리보기 숨기기
    if (newImagePreview.children.length === 0) {
        newImagePreview.style.display = 'none';
    }
}

function removeExistingImage(imageId) {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) {
        return;
    }

    const imageItem = event.target.closest('.image-preview-item');
    const keepInput = imageItem.querySelector('.keep-image-input');
    
    if (imageItem && keepInput) {
        imageItem.style.display = 'none';
        keepInput.remove(); // hidden input 제거하여 서버에서 삭제 처리
    }
}

// 글자 수 카운터
function setupCharCounters() {
    const contentTextarea = document.getElementById('content');
    const contentCharCount = document.getElementById('contentCharCount');

    if (contentTextarea && contentCharCount) {
        // 초기 글자 수 설정
        updateCharCount(contentTextarea, contentCharCount);
        
        contentTextarea.addEventListener('input', function() {
            updateCharCount(this, contentCharCount);
        });
    }
}

function updateCharCount(textarea, counter) {
    const currentLength = textarea.value.length;
    const maxLength = parseInt(textarea.getAttribute('maxlength'));
    
    counter.textContent = currentLength;
    
    // 글자 수가 90% 이상이면 경고 색상
    if (currentLength >= maxLength * 0.9) {
        counter.style.color = '#dc3545';
    } else {
        counter.style.color = '#777';
    }
}

// 폼 검증
function setupFormValidation() {
    const editForm = document.querySelector('.edit-form');
    
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
            }
        });
    }
}

function validateForm() {
    const content = document.getElementById('content').value.trim();
    
    if (content.length === 0) {
        alert('내용을 입력해주세요.');
        document.getElementById('content').focus();
        return false;
    }

    if (content.length > 1000) {
        alert('내용은 1000자 이하로 입력해주세요.');
        document.getElementById('content').focus();
        return false;
    }

    return true;
}

// 모달 관련 함수들
function closeModal() {
    if (confirm('수정을 취소하시겠습니까? 작성된 내용이 사라집니다.')) {
        window.history.back();
    }
}

function cancelEdit() {
    closeModal();
}

// CSRF 토큰 설정
function setupCSRF() {
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
    
    // fetch 요청시 사용할 수 있도록 전역 설정
    window.csrfToken = token;
    window.csrfHeader = header;
}

// 초기화 시 CSRF 설정
setupCSRF();