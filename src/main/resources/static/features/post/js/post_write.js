/* ===================================================================
 * 게시글 작성 모달
 * =================================================================== */
const PostModal = {
  modal: null, form: null, imageInput: null,
  stageEl: null, thumbsEl: null, textarea: null,
  submitBtnText: null, submitBtnLoader: null,

  files: [], activeIndex: 0, isSubmitting: false, gpsFromImg: null,

  init() {
    this.modal = document.getElementById('postModal');
    this.form = document.getElementById('postForm');
    this.imageInput = document.getElementById('imageInput');
    this.stageEl = document.getElementById('imageStage');
    this.thumbsEl = document.getElementById('imageThumbs');
    this.textarea = document.getElementById('postContent');
    this.submitBtnText = document.getElementById('submitBtnText');
    this.submitBtnLoader = document.getElementById('submitBtnLoader');
    if (!this.modal || !this.form || !this.imageInput) {
      return;
    }
    this.bindEvents();
  },

  bindEvents() {
    // 열기 버튼들
    document.getElementById('openPostModalEmpty')?.addEventListener('click',
        () => this.open());
    document.getElementById('openPostModal')?.addEventListener('click',
        () => this.open());
    document.getElementById('mobilePostBtn')?.addEventListener('click',
        () => this.open());

    // 닫기/취소 버튼
    ['closePostModal', 'cancelPost'].forEach(id =>
        document.getElementById(id)?.addEventListener('click',
            () => this.close())
    );

    // ESC 닫기
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal.classList.contains(
          'show')) {
        this.close();
      }
    });

    // 이미지 선택/드롭
    this.imageInput.addEventListener('change', e => {
      this.handleFileSelect(e.target.files);
      this.extractGps(e.target.files?.[0]);
    });
    const upload = document.getElementById('imageUploadSection');
    if (upload) {
      upload.addEventListener('click', e => {
        if (!e.target.closest('.thumb-item')) {
          this.imageInput.click();
        }
      });
      upload.addEventListener('dragover', e => {
        e.preventDefault();
        upload.classList.add('drag-over');
      });
      upload.addEventListener('dragleave', e => {
        if (!upload.contains(e.relatedTarget)) {
          upload.classList.remove(
              'drag-over');
        }
      });
      upload.addEventListener('drop', e => {
        e.preventDefault();
        upload.classList.remove('drag-over');
        this.handleFileSelect(e.dataTransfer.files);
        this.extractGps(e.dataTransfer.files?.[0]);
      });
    }

    // 본문 카운터
    this.textarea?.addEventListener('input', () =>
        (document.getElementById(
            'charCount').textContent = this.textarea.value.length)
    );

    // 제출
    this.form.addEventListener('submit', e => this.handleSubmit(e));
  },

  open() {
    this.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.textarea?.focus();
  },
  close() {
    this.modal.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => this.resetForm(), 250);
  },
  resetForm() {
    this.form.reset();
    this.files = [];
    this.activeIndex = 0;
    this.gpsFromImg = null;
    this.stageEl.innerHTML = '';
    this.thumbsEl.innerHTML = '';
    this.setLoading(false);
    document.getElementById('charCount').textContent = '0';
    document.querySelector('.upload-placeholder')?.classList.remove(
        'visually-hidden');
  },

  handleFileSelect(fileList) {
    const MAX = 3, TYPES = /image\/(jpeg|jpg|png|gif|webp)/,
        SIZE = 50 * 1024 * 1024;
    const incoming = Array.from(fileList || []);
    for (const f of incoming) {
      if (!TYPES.test(f.type)) {
        return alert(`${f.name}: 지원하지 않는 형식입니다.`);
      }
      if (f.size > SIZE) {
        return alert(`${f.name}: 50MB를 초과합니다.`);
      }
    }
    if (this.files.length + incoming.length > MAX) {
      return alert(
          `이미지는 최대 ${MAX}장까지만 업로드할 수 있습니다.`);
    }

    this.files.push(...incoming);
    const dt = new DataTransfer();
    this.files.forEach(f => dt.items.add(f));
    this.imageInput.files = dt.files;

    this.activeIndex = 0;
    this.renderStage();
    this.renderThumbs();
    document.querySelector('.upload-placeholder')?.classList.add(
        'visually-hidden');
  },
  renderStage() {
    this.stageEl.innerHTML = '';
    const file = this.files[this.activeIndex];
    if (!file) {
      return;
    }
    const img = document.createElement('img');
    img.className = 'stage-image';
    img.alt = `image ${this.activeIndex + 1}`;
    const reader = new FileReader();
    reader.onload = e => img.src = e.target.result;
    reader.readAsDataURL(file);
    this.stageEl.appendChild(img);
  },
  renderThumbs() {
    this.thumbsEl.innerHTML = '';
    this.files.forEach((file, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'thumb-item' + (idx === this.activeIndex ? ' active'
          : '');
      wrap.onclick = () => {
        this.activeIndex = idx;
        this.renderStage();
        this.renderThumbs();
      };
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = e => img.src = e.target.result;
      reader.readAsDataURL(file);
      wrap.appendChild(img);
      this.thumbsEl.appendChild(wrap);
    });
  },

  extractGps(file) {
    if (!file) {
      this.gpsFromImg = null;
      return;
    }
    EXIF.getData(file, function () {
      const lat = EXIF.getTag(this, 'GPSLatitude');
      const lng = EXIF.getTag(this, 'GPSLongitude');
      if (!lat || !lng) {
        return (PostModal.gpsFromImg = null);
      }
      const toDec = (dms, ref) => (dms[0] + dms[1] / 60 + dms[2] / 3600)
          * (['S', 'W'].includes(ref) ? -1 : 1);
      PostModal.gpsFromImg = {
        lat: toDec(lat, EXIF.getTag(this, 'GPSLatitudeRef') || 'N'),
        lng: toDec(lng, EXIF.getTag(this, 'GPSLongitudeRef') || 'E')
      };
    });
  },

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) {
      return;
    }
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.setLoading(true);
    try {
      const formData = new FormData(this.form);
      const res = await fetch(this.form.action || '/posts',
          {method: 'POST', body: formData});
      if (res.ok) {
        this.close();
        window.location.reload();
      } else {
        console.error(await res.text());
        alert('게시글 작성 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      this.isSubmitting = false;
      this.setLoading(false);
    }
  },

  validateForm() {
    const {content, location, lat, lng} = this.form;
    if (!content.value.trim()) {
      return alert('내용을 입력하세요.');
    }
    if (content.value.length > 200) {
      return alert('내용은 200자를 넘을 수 없습니다.');
    }
    if (!location.value.trim()) {
      return alert('위치를 입력하세요.');
    }
    if (this.imageInput.files.length === 0) {
      return alert('이미지를 최소 1장 업로드하세요.');
    }
    const latV = parseFloat(lat.value), lngV = parseFloat(lng.value);
    if (this.gpsFromImg && !isNaN(latV) && !isNaN(lngV)) {
      if (this.haversine(this.gpsFromImg, {lat: latV, lng: lngV}) > 200) {
        return alert('사진 GPS와 선택 위치가 200 m 이상 차이납니다.');
      }
    }
    return true;
  },

  setLoading(on) {
    this.submitBtnText.textContent = on ? '작성 중...' : '작성하기';
    this.submitBtnLoader.style.display = on ? 'inline-flex' : 'none';
  },
  haversine(a, b) {
    const R = 6371000, rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    return 2 * R * Math.asin(Math.sqrt(
        Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat))
        * Math.sin(dLng / 2) ** 2
    ));
  }
};

// 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PostModal.init());
} else {
  PostModal.init();
}

// ===== 전역 내보내기 (인라인 핸들러 호환) =====
window.PostModal = PostModal;
window.openPostModal = () => PostModal.open();
window.closePostWrite = () => PostModal.close();   // ← 닫기 버튼에서 이걸 호출
// (안전장치) 페이지 어딘가에서 closeModal()을 쓸 수도 있으니 없을 때만 연결
if (typeof window.closeModal !== 'function' && document.getElementById(
    'postModal')) {
  window.closeModal = window.closePostWrite;
}
