const PostModal = {
  /* ---------- DOM 캐시 ---------- */
  modal:      null,
  form:       null,
  submitBtn:  null,

  /* ---------- 상태 ---------- */
  isSubmitting: false,
  selectedFiles: [],

  /* ========== 초기화 ========== */
  init() {
    this.modal     = document.getElementById('postModal');
    this.form      = document.getElementById('postForm');
    this.submitBtn = document.getElementById('submitBtn');

    if (!this.modal || !this.form) {
      console.warn('PostModal: 필수 DOM 요소를 찾을 수 없습니다.');
      return;
    }
    this.bindEvents();
    this.initImageUpload();
    console.log('PostModal: 초기화 완료');
  },

  /* ========== 이벤트 바인딩 ========== */
  bindEvents() {
    /* 모달 열기 */
    ['openPostModal', 'openPostModalEmpty'].forEach(id => {
      const btn = document.getElementById(id);
      btn && btn.addEventListener('click', () => PostModal.open());
    });

    /* 모달 닫기 */
    ['closePostModal', 'cancelPost'].forEach(id => {
      const btn = document.getElementById(id);
      btn && btn.addEventListener('click', () => PostModal.close());
    });

    /* 배경 클릭 · ESC */
    this.modal.addEventListener('click',  e => (e.target === this.modal) && PostModal.close());
    document.addEventListener('keydown',  e => (e.key === 'Escape' && this.modal.classList.contains('show')) && PostModal.close());

    /* 폼 제출 */
    this.form.addEventListener('submit', e => PostModal.handleSubmit(e));

    /* textarea 자동 높이/글자 수 */
    const textarea = this.form.querySelector('.content-textarea');
    if (textarea) {
      textarea.addEventListener('input', e => {
        PostModal.autoResizeTextarea(e);
        PostModal.updateCharCounter(e.target.value);
      });
    }

    /* 현재 위치 버튼 */
    const currentLocationBtn = document.getElementById('currentLocationBtn');
    currentLocationBtn && currentLocationBtn.addEventListener('click', () => {
      window.GoogleMapsManager?.moveToCurrentLocation();
    });
  },

  /* ========== 모달 컨트롤 ========== */
  open() {
    this.modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    /* 첫 input 포커스 */
    const firstInput = this.form.querySelector('.content-textarea');
    firstInput && setTimeout(() => firstInput.focus(), 300);

    /* 지도를 모달 애니메이션 이후 초기화 */
    setTimeout(() => { window.initMap?.(); }, 100);
    console.log('PostModal: 모달 열림');
  },

  close() {
    if (this.isSubmitting && !confirm('게시글을 작성 중입니다. 정말 취소하시겠습니까?')) return;

    this.modal.classList.remove('show');
    document.body.style.overflow = '';

    setTimeout(() => PostModal.resetForm(), 300);
    console.log('PostModal: 모달 닫힘');
  },

  /* ========== 폼 & 이미지 ========== */
  resetForm() {
    this.form.reset();
    this.selectedFiles = [];
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('heritageId').value = '';
    this.resetSubmitButton();
  },

  initImageUpload() {
    const uploadSection = document.getElementById('imageUploadSection');
    const imageInput    = document.getElementById('imageInput');
    if (!uploadSection || !imageInput) return;

    uploadSection.addEventListener('click', e => {
      if (!e.target.closest('.image-preview-item, .remove-image')) imageInput.click();
    });
    imageInput.addEventListener('change', e => PostModal.handleFileSelect(e.target.files));

    /* D&D */
    uploadSection.addEventListener('dragover',  e => { e.preventDefault(); uploadSection.classList.add('drag-over'); });
    uploadSection.addEventListener('dragleave', e => { if (!uploadSection.contains(e.relatedTarget)) uploadSection.classList.remove('drag-over'); });
    uploadSection.addEventListener('drop',      e => { e.preventDefault(); uploadSection.classList.remove('drag-over'); PostModal.handleFileSelect(e.dataTransfer.files); });
  },

  handleFileSelect(files) {
    const MAX_FILES = 3, MAX_SIZE = 10 * 1024 * 1024;
    const TYPES = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];

    /* 유효성 */
    if (files.length > MAX_FILES) return alert(`최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
    const valid = [...files].filter(f => {
      if (!TYPES.includes(f.type))      return alert(`${f.name}: 지원하지 않는 형식`), false;
      if (f.size > MAX_SIZE)            return alert(`${f.name}: 10MB 초과`), false;
      return true;
    });
    if (!valid.length || this.selectedFiles.length + valid.length > MAX_FILES) return;

    /* files 갱신 */
    const dt = new DataTransfer();
    [...this.selectedFiles, ...valid].forEach(f => dt.items.add(f));
    document.getElementById('imageInput').files = dt.files;
    this.selectedFiles = [...dt.files];
    this.renderImagePreviews();
  },

  renderImagePreviews() {
    const wrap = document.getElementById('imagePreview');
    wrap.innerHTML = '';
    this.selectedFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = e => {
        wrap.insertAdjacentHTML('beforeend', `
          <div class="image-preview-item">
            <img src="${e.target.result}" class="preview-image" alt="preview ${idx+1}">
            <button type="button" class="remove-image" onclick="PostModal.removeImage(${idx})">&times;</button>
          </div>`);
      };
      reader.readAsDataURL(file);
    });
  },

  removeImage(idx) {
    if (idx < 0 || idx >= this.selectedFiles.length) return;
    this.selectedFiles.splice(idx, 1);
    const dt = new DataTransfer();
    this.selectedFiles.forEach(f => dt.items.add(f));
    document.getElementById('imageInput').files = dt.files;
    this.renderImagePreviews();
  },

  /* ========== 제출 ========== */
  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting || !this.validateForm()) return;

    this.isSubmitting = true;
    this.setSubmitButtonLoading(true);

    try {
      const res = await fetch(this.form.action, {
        method : 'POST',
        body   : new FormData(this.form),
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (res.ok) {
        this.showSuccessMessage('게시글이 성공적으로 작성되었습니다.');
        this.close();      // 모달 닫기
        setTimeout(() => location.reload(), 1000);
      } else {
        const msg = (await res.json().catch(() => ({}))).message || '게시글 작성에 실패했습니다.';
        this.showErrorMessage(msg);
      }
    } catch (err) {
      console.error(err);
      this.showErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      this.isSubmitting = false;
      this.setSubmitButtonLoading(false);
    }
  },

  validateForm() {
    const content  = this.form.content.value.trim();
    const location = this.form.location.value.trim();
    const images   = this.form.images.files;

    if (!content)                 return alert('게시글 내용을 입력해주세요.'), false;
    if (content.length > 200)     return alert('게시글 내용은 200자를 초과할 수 없습니다.'), false;
    if (!location)                return alert('위치를 입력해주세요.'), false;
    if (!images.length)           return alert('최소 1장의 이미지를 업로드해주세요.'), false;

    return true;
  },

  /* ========== UI 헬퍼 ========== */
  setSubmitButtonLoading(flag) {
    this.submitBtn.disabled  = flag;
    this.submitBtn.textContent = flag ? '작성 중...' : '게시글 작성';
    this.submitBtn.style.cursor = flag ? 'not-allowed' : 'pointer';
  },
  resetSubmitButton() { this.setSubmitButtonLoading(false); },

  showSuccessMessage(msg){ window.toastManager?.show(msg,'success') || alert(msg); },
  showErrorMessage(msg){   window.toastManager?.show(msg,'error')   || alert(msg);  },

  autoResizeTextarea(e){
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
  },
  updateCharCounter(val){
    const counter = document.getElementById('charCounter');
    counter && (counter.textContent = `${val.length}/200`);
  }
};

/* ---------- 페이지 로드 시 초기화 ---------- */
document.addEventListener('DOMContentLoaded', () => PostModal.init());

/* 전역 노출 (외부 onclick 등) */
window.PostModal = PostModal;