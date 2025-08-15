// features/post/js/post_edit.js
// 게시글 수정 모듈 - 상세와 동일한 갤러리 UX + 편집(추가/삭제) + 전파 차단
(function () {
  const $ = (id) => document.getElementById(id);

  let images = [];
  let current = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initializeEditGallery();
    initializeEditImageManagement();
    initializeEditFormSubmit();
  });

  /** 갤러리 DOM이 없을 때(이미지 0장) 초기 구조 생성 */
  function ensureGalleryStructure() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return null;
    }

    let gallery = editModal.querySelector('.gallery');
    if (!gallery) {
      const left = editModal.querySelector('.compose-left');
      if (!left) {
        return null;
      }

      gallery = document.createElement('div');
      gallery.className = 'gallery';

      const main = document.createElement('div');
      main.className = 'gallery-main';
      main.id = 'galleryMain';

      const img = document.createElement('img');
      img.id = 'mainImage';
      img.alt = '게시글 이미지';
      img.setAttribute('draggable', 'false');
      main.appendChild(img);

      // 편집 전용 네비게이션 (id로 바인딩하여 상세 전역과 충돌 방지)
      const prev = document.createElement('button');
      prev.className = 'gallery-nav prev';
      prev.id = 'editPrevBtn';
      prev.setAttribute('aria-label', '이전 이미지');
      prev.textContent = '‹';

      const next = document.createElement('button');
      next.className = 'gallery-nav next';
      next.id = 'editNextBtn';
      next.setAttribute('aria-label', '다음 이미지');
      next.textContent = '›';

      main.appendChild(prev);
      main.appendChild(next);

      gallery.appendChild(main);

      const thumbs = document.createElement('div');
      thumbs.className = 'gallery-thumbs';
      gallery.appendChild(thumbs);

      const noImage = editModal.querySelector('.no-image');
      if (noImage && noImage.parentNode) {
        noImage.parentNode.insertBefore(gallery, noImage.nextSibling);
      } else {
        left.appendChild(gallery);
      }
    }
    return gallery;
  }

  /** 초기화: 상세와 동일하게 상태 구성 */
  function initializeEditGallery() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    const thumbs = editModal.querySelectorAll('.thumb img');
    const main = editModal.querySelector('#mainImage');

    if (thumbs.length) {
      images = Array.from(thumbs).map((img, i) => ({
        url: img.dataset.full || img.src,
        alt: img.alt || `이미지 ${i + 1}`
      }));
    } else if (main?.src) {
      images = [{url: main.src, alt: '이미지 1'}];
    } else {
      images = [];
    }

    current = 0;
    updateEditGallery();
    bindEditGalleryEvents();
    ensureAddButton();
  }

  /** 이벤트(썸네일/화살표) — 전파 차단으로 상세와 충돌 방지 */
  function bindEditGalleryEvents() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    editModal.querySelectorAll('.thumb').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('.thumb-delete-btn')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        if (!isNaN(index)) {
          showEditImage(index);
        }
      });
    });

    const prevBtn = editModal.querySelector('#editPrevBtn');
    const nextBtn = editModal.querySelector('#editNextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevEditImage();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextEditImage();
      });
    }
  }

  /** UI 업데이트(메인/썸네일/네비/+버튼) */
  function updateEditGallery() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    const main = editModal.querySelector('#mainImage');
    if (main && images[current]) {
      main.style.opacity = '0.5';
      setTimeout(() => {
        main.src = images[current].url;
        main.alt = images[current].alt;
        main.style.opacity = '1';
      }, 120);
    }

    editModal.querySelectorAll('.thumb').forEach(
        (t, i) => t.classList.toggle('active', i === current)
    );

    const prev = editModal.querySelector('#editPrevBtn');
    const next = editModal.querySelector('#editNextBtn');
    if (prev && next) {
      const multi = images.length > 1;
      prev.style.display = multi ? 'flex' : 'none';
      next.style.display = multi ? 'flex' : 'none';
    }

    ensureAddButton();
  }

  function prevEditImage() {
    if (images.length > 1) {
      current = (current - 1 + images.length) % images.length;
      updateEditGallery();
    }
  }

  function nextEditImage() {
    if (images.length > 1) {
      current = (current + 1) % images.length;
      updateEditGallery();
    }
  }

  function showEditImage(i) {
    if (i >= 0 && i < images.length) {
      current = i;
      updateEditGallery();
    }
  }

  /** 이미지 추가/삭제 초기화 */
  function initializeEditImageManagement() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    bindEditDeleteButtons();

    const imageInput = editModal.querySelector('#imageInput');
    if (imageInput) {
      imageInput.addEventListener('change', handleEditImageAdd);
    }

    // 글자수 카운트
    const contentTextarea = editModal.querySelector('#content');
    const charCount = editModal.querySelector('#contentCharCount');
    if (contentTextarea && charCount) {
      charCount.textContent = String(contentTextarea.value?.length || 0);
      contentTextarea.addEventListener('input', () => {
        charCount.textContent = contentTextarea.value.length;
      });
    }
  }

  function bindEditDeleteButtons() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }
    editModal.querySelectorAll('.thumb-delete-btn').forEach(btn => {
      btn.addEventListener('click', handleEditImageDelete);
    });
  }

  /** 삭제 */
  function handleEditImageDelete(e) {
    e.preventDefault();
    e.stopPropagation();

    const editModal = $('postEditModal');
    const deleteBtn = e.target;
    const imageId = deleteBtn.dataset.imageId;
    const thumbElement = deleteBtn.closest('.thumb');
    const isNewImage = deleteBtn.hasAttribute('data-new-image');
    if (!thumbElement) {
      return;
    }

    // 기존 이미지면 keep 제거 + removed 누적
    if (imageId && !isNewImage) {
      const keepInput = thumbElement.querySelector('.keep-image-input');
      if (keepInput) {
        keepInput.remove();
      }

      let removedInput = editModal.querySelector('input[name="removedImages"]');
      if (!removedInput) {
        removedInput = document.createElement('input');
        removedInput.type = 'hidden';
        removedInput.name = 'removedImages';
        removedInput.value = '';
        editModal.querySelector('form')?.appendChild(removedInput);
      }
      const currentRemoved = removedInput.value ? removedInput.value.split(',')
          : [];
      if (!currentRemoved.includes(imageId)) {
        currentRemoved.push(imageId);
        removedInput.value = currentRemoved.join(',');
      }
    }

    // 상태/DOM 제거
    const thumbIndex = parseInt(thumbElement.dataset.index);
    thumbElement.remove();
    if (!Number.isNaN(thumbIndex) && thumbIndex >= 0 && thumbIndex
        < images.length) {
      images.splice(thumbIndex, 1);
    }

    reindexEditThumbnails();
    updateAfterEditDelete();
  }

  /** 추가 */
  function handleEditImageAdd(e) {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    const files = Array.from(e.target.files || []);
    const currentCount = editModal.querySelectorAll('.thumb').length;

    if (currentCount + files.length > 3) {
      alert('이미지는 최대 3장까지만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }

    ensureGalleryStructure();
    hideEditNoImage();

    files.forEach((file, index) => {
      if (!validateEditImageFile(file)) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => createEditNewThumbnail(event.target.result);
      reader.readAsDataURL(file);
    });

    ensureAddButton();
  }

  function validateEditImageFile(file) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'image/webp'];
    const max = 50 * 1024 * 1024;
    if (!allowed.includes(file.type)) {
      alert(`${file.name}: 지원하지 않는 형식입니다.`);
      return false;
    }
    if (file.size > max) {
      alert(`${file.name}: 파일 크기가 50MB를 초과합니다.`);
      return false;
    }
    return true;
  }

  /** 새 썸네일 생성(+ 삭제 버튼/클릭 바인딩 포함) */
  function createEditNewThumbnail(imageSrc) {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    const gallery = ensureGalleryStructure();
    if (!gallery) {
      return;
    }

    let thumbsContainer = gallery.querySelector('.gallery-thumbs');
    if (!thumbsContainer) {
      thumbsContainer = document.createElement('div');
      thumbsContainer.className = 'gallery-thumbs';
      gallery.appendChild(thumbsContainer);
    }

    const newThumb = document.createElement('button');
    newThumb.type = 'button';
    newThumb.className = 'thumb';
    newThumb.dataset.index = thumbsContainer.querySelectorAll('.thumb').length;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = `썸네일 ${Number(newThumb.dataset.index) + 1}`;
    img.setAttribute('data-full', imageSrc);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'thumb-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', '이미지 삭제');
    deleteBtn.setAttribute('data-new-image', 'true');
    deleteBtn.addEventListener('click', handleEditImageDelete);

    newThumb.appendChild(img);
    newThumb.appendChild(deleteBtn);

    newThumb.addEventListener('click', (e) => {
      if (e.target.closest('.thumb-delete-btn')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(newThumb.dataset.index);
      if (!isNaN(index)) {
        showEditImage(index);
      }
    });

    const addBtn = thumbsContainer.querySelector('.thumb-add-btn');
    if (addBtn) {
      thumbsContainer.insertBefore(newThumb, addBtn);
    } else {
      thumbsContainer.appendChild(newThumb);
    }

    images.push({url: imageSrc, alt: `이미지 ${images.length + 1}`, isNew: true});

    if (images.length === 1) {
      current = 0;
      newThumb.classList.add('active');
      showEditGallery();
    }

    updateEditGallery();
    reindexEditThumbnails();
    ensureAddButton();
  }

  function reindexEditThumbnails() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }
    editModal.querySelectorAll('.thumb').forEach((thumb, index) => {
      thumb.dataset.index = index;
      const img = thumb.querySelector('img');
      if (img) {
        img.alt = `썸네일 ${index + 1}`;
      }
    });
  }

  function updateAfterEditDelete() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    const thumbCount = editModal.querySelectorAll('.thumb').length;

    if (thumbCount === 0) {
      showEditNoImage();
      current = 0;
    } else {
      if (current >= thumbCount) {
        current = thumbCount - 1;
      }
      editModal.querySelectorAll('.thumb').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === current);
      });
      updateEditGallery();
    }
    ensureAddButton();
  }

  function showEditNoImage() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }
    editModal.querySelector('.gallery')?.setAttribute('style', 'display:none');
    const noImage = editModal.querySelector('.no-image');
    if (noImage) {
      noImage.style.display = 'block';
    }
  }

  function showEditGallery() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }
    const gallery = editModal.querySelector('.gallery');
    if (gallery) {
      gallery.style.display = 'block';
    }
    const noImage = editModal.querySelector('.no-image');
    if (noImage) {
      noImage.style.display = 'none';
    }
  }

  function hideEditNoImage() {
    showEditGallery();
  }

  /** 썸네일 맨 오른쪽 + 버튼 유지(3장 제한 시 숨김) */
  function ensureAddButton() {
    const editModal = $('postEditModal');
    if (!editModal) {
      return;
    }

    const gallery = ensureGalleryStructure();
    if (!gallery) {
      return;
    }

    let thumbs = gallery.querySelector('.gallery-thumbs');
    if (!thumbs) {
      thumbs = document.createElement('div');
      thumbs.className = 'gallery-thumbs';
      gallery.appendChild(thumbs);
    }

    let addBtn = thumbs.querySelector('.thumb-add-btn');
    if (!addBtn) {
      addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'thumb-add-btn';
      addBtn.setAttribute('aria-label', '이미지 추가');
      addBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>`;
      const input = $('imageInput');
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        input?.click();
      });
      thumbs.appendChild(addBtn);
    }

    // 항상 맨 끝
    thumbs.appendChild(addBtn);

    // 3장 제한
    const thumbCount = thumbs.querySelectorAll('.thumb').length;
    addBtn.style.display = thumbCount >= 3 ? 'none' : 'flex';
  }

  /** 폼 제출 */
  function initializeEditFormSubmit() {
    const form = $('postEditForm');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const editModal = $('postEditModal');
      const postId = editModal?.dataset.postId;
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

        const formData = new FormData(form);
        if (!formData.has('_method')) {
          formData.append('_method', 'PUT');
        }

        const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
        const csrfHeader = document.querySelector(
            'meta[name="_csrf_header"]')?.content;
        const headers = {'X-Requested-With': 'XMLHttpRequest'};
        if (csrfToken && csrfHeader) {
          headers[csrfHeader] = csrfToken;
        }

        const res = await fetch(`/posts/${postId}`,
            {method: 'POST', headers, body: formData});

        if (res.ok) {
          if (window.closePostEdit) {
            window.closePostEdit();
          }
          setTimeout(() => {
            if (window.openPostDetail) {
              window.openPostDetail(postId);
            } else {
              window.location.href = `/posts/${postId}`;
            }
          }, 300);
        } else {
          throw new Error('수정 중 오류가 발생했습니다.');
        }

        if (submitBtn) {
          submitBtn.textContent = originalText || '수정 완료';
        }
      } catch (err) {
        console.error(err);
        alert('게시글 수정 중 오류가 발생했습니다.');
      } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  }

  /** 모달 닫기 */
  function closePostEdit() {
    const modal = $('postEditModal');
    if (modal) {
      modal.classList.remove('show');
      modal.classList.add('closing');
      setTimeout(() => {
        modal.classList.remove('closing');
        modal.style.display = 'none';
        modal.innerHTML = '';
      }, 220);
    } else {
      window.history.back?.() || (window.location.href = '/posts');
    }
  }

  function cancel() {
    closePostEdit();
  }

  window.PostEdit = {
    cancel,
    close: closePostEdit,
    closePostEdit,
    initializeImageGallery: initializeEditGallery,
    initializeImageManagement: initializeEditImageManagement,
    initializeFormSubmit: initializeEditFormSubmit
  };
  window.closePostEdit = closePostEdit;
})();