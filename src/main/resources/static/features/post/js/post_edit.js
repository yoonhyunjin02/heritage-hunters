// features/post/js/post_edit.js
(function () {
  // 상태
  let images = [];   // [{url, alt, id?, isNew?}]
  let current = 0;

  /**
   * 수정 모달의 모든 기능을 초기화하는 메인 함수.
   * 이 함수는 post_detail.js에서 모달이 로드된 후 호출됩니다.
   */
  function initializePostEdit() {
    initEditGallery();
    initImageEditTools();
    initFormSubmit();
  }

  /** 초기 갤러리 세팅(상세와 동일) */
  function initEditGallery() {
    collectImagesFromDOM();
    // 초기 메인 이미지 세팅
    if (images.length) {
      current = 0;
      updateUI();
    } else {
      showNoImage();
    }

    // 이벤트 위임(클릭)
    const root = document.getElementById('postEditModal');
    if (!root) return;
    
    // 기존 리스너가 있다면 제거하여 중복 방지
    if (root.handleClickDeleted) {
        root.removeEventListener('click', root.handleClickDeleted);
        root.removeEventListener('keydown', root.handleKeydown);
    }
    
    // 새 리스너 저장 및 등록
    root.handleClickDeleted = handleClickDeleted;
    root.handleKeydown = handleKeydown;
    root.addEventListener('click', root.handleClickDeleted);
    root.addEventListener('keydown', root.handleKeydown);
  }

  /** DOM에서 썸네일을 읽어 images 배열 구성 */
  function collectImagesFromDOM() {
    const thumbImgs = document.querySelectorAll('#postEditModal .thumb img');
    images = Array.from(thumbImgs).map((img, i) => {
      const thumb = img.closest('.thumb');
      return {
        url: img.dataset.full || img.src || '',
        alt: img.alt || `이미지 ${i + 1}`,
        id: thumb?.querySelector('.keep-image-input')?.value // 기존 이미지면 id 있음
      };
    }).filter(it => it.url);
  }

  /** 삭제 클릭 처리 */
  function handleClickDeleted(e) {
    // 삭제 버튼
    const del = e.target.closest('.thumb-delete-btn');
    if (del) {
      e.preventDefault();
      e.stopPropagation();
      onDeleteThumb(del);
      return;
    }

    // 썸네일
    const thumb = e.target.closest('.thumb');
    if (thumb && !thumb.classList.contains('thumb-add-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(thumb.dataset.index);
      if (!Number.isNaN(idx)) {
        showImage(idx);
      }
      return;
    }

    // 네비
    if (e.target.closest('.gallery-nav.prev')) {
      e.preventDefault();
      e.stopPropagation();
      prevImage();
      return;
    }
    if (e.target.closest('.gallery-nav.next')) {
      e.preventDefault();
      e.stopPropagation();
      nextImage();
      return;
    }

    // 추가 버튼 / 업로드 버튼
    if (e.target.closest('.thumb-add-btn')) {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('imageInput')?.click();
      return;
    }
  }

  /** 방향키 ←/→ */
  function handleKeydown(e) {
    if (e.key === 'ArrowLeft') {
      prevImage();
    }
    if (e.key === 'ArrowRight') {
      nextImage();
    }
  }

  /** 현재 인덱스 기준으로 메인/썸네일/네비 업데이트 */
  function updateUI() {
    const modal = document.getElementById('postEditModal');
    if (!modal) return;

    const main = modal.querySelector('#mainImage');
    if (images[current] && main) {
      main.style.opacity = '0.5';
      requestAnimationFrame(() => {
        main.src = images[current].url;
        main.alt = images[current].alt;
        setTimeout(() => main.style.opacity = '1', 100);
      });
      showGallery();
    }

    modal.querySelectorAll('.thumb').forEach((t, i) => {
      t.classList.toggle('active', i === current);
    });

    const prev = modal.querySelector('.gallery-nav.prev');
    const next = modal.querySelector('.gallery-nav.next');
    const multi = images.length > 1;
    if (prev) prev.style.display = multi ? 'flex' : 'none';
    if (next) next.style.display = multi ? 'flex' : 'none';

    reindexThumbs();
    updateAddButtonVisibility();
  }

  function prevImage() {
    if (images.length > 1) {
      current = (current - 1 + images.length) % images.length;
      updateUI();
    }
  }

  function nextImage() {
    if (images.length > 1) {
      current = (current + 1) % images.length;
      updateUI();
    }
  }

  function showImage(i) {
    if (i >= 0 && i < images.length) {
      current = i;
      updateUI();
    }
  }

  /** === 편집(추가/삭제) === */
  function initImageEditTools() {
    const input = document.getElementById('imageInput');
    if (input) {
      // 리스너 중복 방지
      if (!input.hasChangeListener) {
        input.addEventListener('change', onFilesSelected);
        input.hasChangeListener = true;
      }
    }
  }

  function onFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    const existing = document.querySelectorAll('#postEditModal .thumb:not(.thumb-add-btn)').length;

    if (existing + files.length > 3) {
      alert('이미지는 최대 3장까지만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }

    files.forEach(file => {
      if (!validateFile(file)) return;
      const reader = new FileReader();
      reader.onload = ev => addNewThumb(ev.target.result, file);
      reader.readAsDataURL(file);
    });
  }

  function validateFile(file) {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const max = 50 * 1024 * 1024;
    if (!ok.includes(file.type)) {
      alert(`${file.name}: 지원하지 않는 형식입니다.`);
      return false;
    }
    if (file.size > max) {
      alert(`${file.name}: 파일 크기가 50MB를 초과합니다.`);
      return false;
    }
    return true;
  }

  function addNewThumb(dataUrl, file) {
    const thumbsContainer = document.querySelector('#postEditModal .gallery-thumbs');
    if (!thumbsContainer) return;

    showGallery();

    const btn = document.createElement('div');
    btn.className = 'thumb';
    
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = `새 이미지: ${file.name}`;
    img.setAttribute('data-full', dataUrl);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'thumb-delete-btn edit-only';
    del.setAttribute('aria-label', '이미지 삭제');
    del.setAttribute('data-new-image', 'true');
    del.textContent = '×';

    btn.appendChild(img);
    btn.appendChild(del);

    const addBtn = thumbsContainer.querySelector('.thumb-add-btn');
    if (addBtn) {
      thumbsContainer.insertBefore(btn, addBtn);
    } else {
      thumbsContainer.appendChild(btn);
    }

    images.push({ url: dataUrl, alt: img.alt, isNew: true, file: file });
    if (images.length === 1) current = 0;
    
    updateUI();
  }

  function onDeleteThumb(delBtn) {
    const thumb = delBtn.closest('.thumb');
    if (!thumb) return;

    const imageId = delBtn.dataset.imageId;
    const isNew = delBtn.hasAttribute('data-new-image');
    const idx = parseInt(thumb.dataset.index);

    if (imageId && !isNew) {
      let removedInput = document.querySelector('input[name="removedImages"]');
      if (!removedInput) {
        removedInput = document.createElement('input');
        removedInput.type = 'hidden';
        removedInput.name = 'removedImages';
        document.getElementById('postEditForm')?.appendChild(removedInput);
      }
      const list = removedInput.value ? removedInput.value.split(',') : [];
      if (!list.includes(imageId)) {
        list.push(imageId);
        removedInput.value = list.join(',');
      }
    }
    
    thumb.remove();

    if (!Number.isNaN(idx) && images[idx]) {
      images.splice(idx, 1);
      if (current >= images.length) {
        current = Math.max(0, images.length - 1);
      }
    }

    if (images.length === 0) {
      showNoImage();
    } else {
      updateUI();
    }
  }

  function reindexThumbs() {
    document.querySelectorAll('#postEditModal .thumb:not(.thumb-add-btn)').forEach((t, i) => {
      t.dataset.index = i;
      const img = t.querySelector('img');
      if (img) img.alt = `이미지 ${i + 1}`;
    });
  }

  function updateAddButtonVisibility() {
    const addBtn = document.querySelector('#postEditModal .thumb-add-btn');
    const count = document.querySelectorAll('#postEditModal .thumb:not(.thumb-add-btn)').length;
    if (addBtn) {
      addBtn.style.display = count >= 3 ? 'none' : 'flex';
    }
  }

  function showGallery() {
    const modal = document.getElementById('postEditModal');
    if (!modal) return;
    const g = modal.querySelector('.gallery');
    const n = modal.querySelector('.no-image');
    if (g) g.style.display = 'block';
    if (n) n.style.display = 'none';
  }

  function showNoImage() {
    const modal = document.getElementById('postEditModal');
    if (!modal) return;
    const g = modal.querySelector('.gallery');
    const n = modal.querySelector('.no-image');
    if (g) g.style.display = 'none';
    if (n) n.style.display = 'flex';
  }

  /** 폼 제출 */
  function initFormSubmit() {
    const form = document.getElementById('postEditForm');
    if (!form) return;

    // 리스너 중복 방지
    if (form.hasSubmitListener) {
        form.removeEventListener('submit', form.submitHandler);
    }
    form.submitHandler = async (e) => {
      e.preventDefault();
      const modal = document.getElementById('postEditModal');
      const postId = modal?.dataset.postId;
      if (!postId) {
        alert('게시글 ID를 찾을 수 없습니다.');
        return;
      }

      try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '수정 중...';
        }

        const fd = new FormData(form);
        if (!fd.has('_method')) {
          fd.append('_method', 'PUT');
        }

        const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
        const csrfHeader = document.querySelector(
            'meta[name="_csrf_header"]')?.content;
        const headers = {'X-Requested-With': 'XMLHttpRequest'};
        if (csrfToken && csrfHeader) {
          headers[csrfHeader] = csrfToken;
        }

        const res = await fetch(`/posts/${postId}`,
            {method: 'POST', headers, body: fd});

        if (res.ok) {
          const postIdStr = String(postId);

          // 1. 캐시 지우기
          if (window.PostListManager && typeof window.PostListManager.clearPostCache === 'function') {
            window.PostListManager.clearPostCache(postIdStr);
          }

          // 2. 수정 모달 닫기
          if (window.closePostEdit) {
            window.closePostEdit();
          }
          
          // 3. 상세 모달 새로고침
          if (window.openPostDetail) {
            // 수정 모달이 닫히는 애니메이션 시간을 기다린 후, 상세 모달을 다시 로드
            setTimeout(() => {
              window.openPostDetail(postIdStr);
              // 성공 토스트 메시지 표시
              if(window.toastManager) {
                window.toastManager.show('게시글이 성공적으로 수정되었습니다.', 'success');
              }
            }, 250);
          }

        } else {
          throw new Error('수정 중 오류가 발생했습니다.');
        }

      } catch (err) {
        console.error(err);
        alert('게시글 수정 중 오류가 발생했습니다.');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '수정 완료';
        }
      }
    };
    form.addEventListener('submit', form.submitHandler);
    form.hasSubmitListener = true;
  }

  // 전역으로 초기화 함수 노출
  window.initializePostEdit = initializePostEdit;
})();