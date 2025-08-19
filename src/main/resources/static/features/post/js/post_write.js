/* ===================================================================
 * 게시글 작성 모달
 * =================================================================== */
const PostModal = {
  modal: null, form: null, imageInput: null,
  stageEl: null, thumbsEl: null, textarea: null,
  submitBtnText: null, submitBtnLoader: null,

  files: [], activeIndex: 0, isSubmitting: false, gpsFromImg: null,

  /**
   * 게시글 작성 모달을 초기화합니다.
   * 
   * @description
   * - DOM 요소들을 캐시하고 이벤트 바인딩
   * - 필수 요소가 없으면 초기화하지 않음
   * - 파일 업로드, 폼 제출 등 모든 이벤트 설정
   */
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

  /**
   * 모든 이벤트 리스너를 바인딩합니다.
   * 
   * @description
   * - 모달 열기/닫기 버튼 이벤트
   * - 파일 선택 및 드래그 앤 드롭 이벤트
   * - 폼 제출 및 입력 검증 이벤트
   * - ESC 키로 모달 닫기 이벤트
   */
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
      // GPS는 첫 번째 사진이 없을 때만 추출 (덮어쓰기 방지)
      if (this.files.length === 0 && e.target.files?.length > 0) {
        this.extractGps(e.target.files[0]);
      }
      this.handleFileSelect(e.target.files);
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
        // GPS는 첫 번째 사진이 없을 때만 추출 (덮어쓰기 방지)
        if (this.files.length === 0 && e.dataTransfer.files?.length > 0) {
          this.extractGps(e.dataTransfer.files[0]);
        }
        this.handleFileSelect(e.dataTransfer.files);
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

  /**
   * 게시글 작성 모달을 엽니다.
   * 
   * @description
   * - 모달을 표시하고 body 스크롤 방지
   * - 텍스트 영역에 자동 포커스
   */
  open() {
    this.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.textarea?.focus();
  },
  /**
   * 게시글 작성 모달을 닫습니다.
   * 
   * @description
   * - 모달을 숨기고 body 스크롤 복원
   * - 250ms 후 폼 초기화
   */
  close() {
    this.modal.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => this.resetForm(), 250);
  },
  /**
   * 폼을 초기 상태로 리셋합니다.
   * 
   * @description
   * - 모든 입력 필드 및 파일 목록 초기화
   * - 이미지 스테이지 및 썸네일 영역 비우기
   * - 로딩 상태 해제 및 문자 카운트 초기화
   * - 업로드 플레이스홀더 다시 표시
   */
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

  /**
   * 선택된 파일들을 처리합니다.
   * 
   * @param {FileList} fileList - 선택된 파일 목록
   * @description
   * - 파일 형식 및 크기 검증 (JPEG, PNG, GIF, WebP / 50MB 이하)
   * - 최대 3장 제한 확인
   * - 유효한 파일들을 files 배열에 추가
   * - DataTransfer를 사용해 input 파일 동기화
   * - 이미지 스테이지 및 썸네일 렌더링
   */
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
  /**
   * 현재 활성 이미지를 메인 스테이지에 렌더링합니다.
   * 
   * @description
   * - 현재 activeIndex에 해당하는 파일을 표시
   * - FileReader를 사용해 파일을 Data URL로 변환
   * - 파일이 없으면 아무것도 렌더링하지 않음
   */
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
  /**
   * 모든 파일들의 썸네일을 렌더링합니다.
   * 
   * @description
   * - files 배열의 모든 파일에 대해 썸네일 생성
   * - 현재 활성 썸네일에 'active' 클래스 적용
   * - 썸네일 클릭 시 해당 이미지로 전환
   * - FileReader를 사용해 썸네일 이미지 생성
   */
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

  /**
   * 이미지 파일에서 GPS 정보를 추출합니다.
   * 
   * @param {File} file - GPS 정보를 추출할 이미지 파일
   * @description
   * - EXIF 데이터에서 GPS 위도/경도 정보 추출
   * - DMS(도분초) 형식을 십진수 형식으로 변환
   * - 첫 번째 사진의 GPS만 사용 (이후 사진은 무시)
   * - 추출된 GPS는 위치 검증에 사용
   */
  extractGps(file) {
    if (!file) {
      this.gpsFromImg = null;
      return;
    }
    
    // 이미 GPS가 설정되어 있으면 덮어쓰지 않음 (첫 번째 사진 우선)
    if (this.gpsFromImg !== null) {
      console.log('GPS 이미 설정됨. 첫 번째 사진의 GPS 유지:', this.gpsFromImg);
      return;
    }
    
    EXIF.getData(file, function () {
      const lat = EXIF.getTag(this, 'GPSLatitude');
      const lng = EXIF.getTag(this, 'GPSLongitude');
      if (!lat || !lng) {
        PostModal.gpsFromImg = null;
        console.log('첫 번째 사진에 GPS 메타데이터가 없음');
        return;
      }
      const toDec = (dms, ref) => (dms[0] + dms[1] / 60 + dms[2] / 3600)
          * (['S', 'W'].includes(ref) ? -1 : 1);
      PostModal.gpsFromImg = {
        lat: toDec(lat, EXIF.getTag(this, 'GPSLatitudeRef') || 'N'),
        lng: toDec(lng, EXIF.getTag(this, 'GPSLongitudeRef') || 'E')
      };
      console.log('첫 번째 사진에서 GPS 추출됨:', PostModal.gpsFromImg);
    });
  },

  /**
   * 폼 제출을 처리합니다.
   * 
   * @async
   * @param {Event} e - 폼 제출 이벤트
   * @description
   * - 폼 검증 후 서버로 데이터 전송
   * - 중복 제출 방지 및 로딩 상태 관리
   * - 성공 시 모달 닫기 후 페이지 새로고침
   * - 실패 시 오류 메시지 표시
   */
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

  /**
   * 폼 입력 내용을 검증합니다.
   * 
   * @returns {boolean} 검증 통과 여부
   * @description
   * - 내용 입력 및 글자 수 제한 확인
   * - 위치 입력 확인
   * - 이미지 업로드 확인 (최소 1장)
   * - GPS 정보와 선택 위치 간의 거리 검증 (200m 이내)
   */
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
    
    // GPS 메타데이터 필수 검증
    if (!this.gpsFromImg) {
      return alert('업로드한 사진에 위치 정보가 없습니다.\nGPS 기능이 켜진 상태에서 촬영한 사진을 업로드해주세요.');
    }
    
    const latV = parseFloat(lat.value), lngV = parseFloat(lng.value);
    if (!isNaN(latV) && !isNaN(lngV)) {
      if (this.haversine(this.gpsFromImg, {lat: latV, lng: lngV}) > 200) {
        return alert('사진 GPS와 선택 위치가 200m 이상 차이납니다.\n사진이 촬영된 위치와 일치하는 장소를 선택해주세요.');
      }
    }
    return true;
  },

  /**
   * 로딩 상태를 설정합니다.
   * 
   * @param {boolean} on - 로딩 상태 여부
   * @description
   * - 제출 버튼 텍스트 및 로딩 스피너 표시 제어
   * - 로딩 중일 때 "작성 중...", 평상시 "작성하기"
   */
  setLoading(on) {
    this.submitBtnText.textContent = on ? '작성 중...' : '작성하기';
    this.submitBtnLoader.style.display = on ? 'inline-flex' : 'none';
  },
  /**
   * 두 지점 간의 거리를 계산합니다 (Haversine formula).
   * 
   * @param {Object} a - 첫 번째 지점 {lat, lng}
   * @param {Object} b - 두 번째 지점 {lat, lng}
   * @returns {number} 두 지점 간의 거리 (미터)
   * @description
   * - GPS 좌표와 선택한 위치 간의 거리 계산
   * - 지구의 곡률을 고려한 정확한 거리 계산
   * - 200m 이내 제한 검증에 사용
   */
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
