const PostModal = {
  /* ---------- DOM 캐시 ---------- */
  modal: null,
  form: null,
  submitBtn: null,
  submitBtnTextEl: null,
  submitBtnLoaderEl: null,
  imageInput: null,
  stageEl: null,     // 대표 이미지 표시 영역 (#imageStage)
  thumbsEl: null,    // 썸네일 스트립 (#imageThumbs)
  textarea: null,

  /* ---------- 상태 ---------- */
  isSubmitting: false,
  files: [],         // File 객체 배열
  activeIndex: 0,    // 대표(스테이지)로 표시할 인덱스

  /* ========== 초기화 ========== */
  init() {
    this.modal            = document.getElementById('postModal');
    this.form             = document.getElementById('postForm');
    this.submitBtn        = document.getElementById('submitBtn');
    this.submitBtnTextEl  = document.getElementById('submitBtnText');
    this.submitBtnLoaderEl= document.getElementById('submitBtnLoader');
    this.imageInput       = document.getElementById('imageInput');
    this.stageEl          = document.getElementById('imageStage');
    this.thumbsEl         = document.getElementById('imageThumbs');
    this.textarea         = this.form?.querySelector('.content-textarea');

    if (!this.modal || !this.form || !this.imageInput || !this.stageEl || !this.thumbsEl) {
      console.warn('PostModal: 필수 DOM 요소를 찾을 수 없습니다.');
      return;
    }

    this.bindEvents();
    console.log('PostModal: 초기화 완료');
  },

  /* ========== 이벤트 바인딩 ========== */
  bindEvents() {
    // 모달 열기 버튼(필요 시 외부에서 호출)
    const openPostModalEmpty = document.getElementById('openPostModalEmpty');
    if (openPostModalEmpty) openPostModalEmpty.addEventListener('click', () => this.open());

    // 모달 닫기
    ['closePostModal', 'cancelPost'].forEach(id => {
      const btn = document.getElementById(id);
      btn && btn.addEventListener('click', () => this.close());
    });

    // 배경 클릭, ESC
    this.modal.addEventListener('click',  e => (e.target === this.modal) && this.close());
    document.addEventListener('keydown',  e => (e.key === 'Escape' && this.modal.classList.contains('show')) && this.close());

    // 폼 제출
    this.form.addEventListener('submit', e => this.handleSubmit(e));

    // 텍스트 영역 자동 높이 & 글자 수
    if (this.textarea) {
      this.textarea.addEventListener('input', e => {
        this.autoResizeTextarea(e);
        this.updateCharCounter(e.target.value);
      });
    }

    // 이미지 업로드 클릭/체인지/드래그
    const uploadSection = document.getElementById('imageUploadSection');
    if (uploadSection) {
      uploadSection.addEventListener('click', e => {
        // 썸네일 클릭은 제외
        if (e.target.closest('.thumb-item')) return;
        this.imageInput.click();
      });

      uploadSection.addEventListener('dragover', e => { e.preventDefault(); uploadSection.classList.add('drag-over'); });
      uploadSection.addEventListener('dragleave', e => { if (!uploadSection.contains(e.relatedTarget)) uploadSection.classList.remove('drag-over'); });
      uploadSection.addEventListener('drop', e => {
        e.preventDefault(); uploadSection.classList.remove('drag-over');
        this.handleFileSelect(e.dataTransfer.files);
      });
    }

    this.imageInput.addEventListener('change', e => this.handleFileSelect(e.target.files));
  },

  /* ========== 모달 컨트롤 ========== */
  open() {
    this.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    // 첫 입력 포커스
    this.textarea && setTimeout(() => this.textarea.focus(), 250);
  },

  close() {
    if (this.isSubmitting && !confirm('게시글을 작성 중입니다. 정말 취소하시겠습니까?')) return;
    this.modal.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => this.resetForm(), 300);
  },

  /* ========== 폼 & 파일 ========== */
  resetForm() {
    this.form.reset();
    this.files = [];
    this.activeIndex = 0;
    // 스테이지/썸네일 초기화
    this.stageEl.innerHTML = '';
    this.thumbsEl.innerHTML = '';
    // 글자수 초기화
    this.updateCharCounter('');
    // 버튼 상태 초기화
    this.setSubmitButtonLoading(false);
  },

  handleFileSelect(fileList) {
    const MAX_FILES = 3, MAX_SIZE = 50 * 1024 * 1024;
    const TYPES = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];

    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    // 형식/용량 검사
    for (const f of incoming) {
      if (!TYPES.includes(f.type))   { alert(`${f.name}: 지원하지 않는 형식입니다.`); return; }
      if (f.size > MAX_SIZE)         { alert(`${f.name}: 10MB를 초과합니다.`); return; }
    }
    if (this.files.length + incoming.length > MAX_FILES) {
      alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
      return;
    }

    // 상태 갱신
    this.files = [...this.files, ...incoming];

    // input[type=file].files 갱신 (FormData 일관성)
    const dt = new DataTransfer();
    this.files.forEach(f => dt.items.add(f));
    this.imageInput.files = dt.files;

    // UI 반영
    if (this.files.length === 1) this.activeIndex = 0;
    this.renderStage();
    this.renderThumbs();
    // 플레이스홀더 숨김
    document.querySelector('.upload-placeholder')?.classList.add('visually-hidden');
  },

  renderStage() {
    this.stageEl.innerHTML = '';
    const file = this.files[this.activeIndex];
    if (!file) return;

    const img = document.createElement('img');
    img.className = 'stage-image';
    img.alt = `image ${this.activeIndex + 1}`;

    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; };
    reader.readAsDataURL(file);

    this.stageEl.appendChild(img);
  },

  renderThumbs() {
    this.thumbsEl.innerHTML = '';
    this.files.forEach((file, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'thumb-item' + (idx === this.activeIndex ? ' active' : '');
      wrap.addEventListener('click', () => {
        this.activeIndex = idx;
        this.renderStage();
        this.renderThumbs();
      });

      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; };
      reader.readAsDataURL(file);

      wrap.appendChild(img);
      this.thumbsEl.appendChild(wrap);
    });
  },

  /* ========== 제출 ========== */
  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting || !this.validateForm()) return;

    this.isSubmitting = true;
    this.setSubmitButtonLoading(true);

    try {
      const res = await fetch(this.form.action, {
        method: 'POST',
        body: new FormData(this.form),
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (res.ok) {
        this.toast('게시글이 성공적으로 작성되었습니다.', 'success');
        this.close();
        setTimeout(() => location.reload(), 800);
      } else {
        let msg = '게시글 작성에 실패했습니다.';
        try { msg = (await res.json()).message || msg; } catch(e){}
        this.toast(msg, 'error');
      }
    } catch (err) {
      console.error(err);
      this.toast('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
      this.isSubmitting = false;
      this.setSubmitButtonLoading(false);
    }
  },

  validateForm() {
    const content  = (this.form.content.value || '').trim();
    const location = (this.form.location.value || '').trim();
    if (!content)             return alert('게시글 내용을 입력해주세요.'), false;
    if (content.length > 200) return alert('게시글 내용은 200자를 초과할 수 없습니다.'), false;
    if (!location)            return alert('위치를 입력해주세요.'), false;
    if (this.imageInput.files.length === 0) return alert('최소 1장의 이미지를 업로드해주세요.'), false;
    return true;
  },

  /* ========== UI 헬퍼 ========== */
  setSubmitButtonLoading(loading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = loading;
    if (this.submitBtnTextEl) this.submitBtnTextEl.textContent = loading ? '작성 중...' : '작성하기';
    if (this.submitBtnLoaderEl) this.submitBtnLoaderEl.style.display = loading ? 'inline-flex' : 'none';
  },

  toast(msg, type) {
    window.toastManager?.show(msg, type) || alert(msg);
  },

  autoResizeTextarea(e) {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
  },

  updateCharCounter(val) {
    const el = document.getElementById('charCount'); // ✅ 마크업과 동일하게 수정
    if (el) el.textContent = String(val.length);
  }
};

/* ---------- 페이지 로드 시 초기화 ---------- */
document.addEventListener('DOMContentLoaded', () => PostModal.init());
window.PostModal = PostModal; // 외부에서 open/close 호출 가능