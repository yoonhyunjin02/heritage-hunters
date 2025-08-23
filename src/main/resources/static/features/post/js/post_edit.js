/**
 * 게시글 수정 모달의 모든 기능을 관리하는 스크립트
 * 
 * 주요 기능:
 * - 이미지 갤러리 관리 (네비게이션, 썸네일)
 * - 이미지 추가/삭제 기능
 * - 폼 제출 및 AJAX 통신
 */

// features/post/js/post_edit.js
(function () {
  /**
   * 이미지 상태 관리 배열
   * @type {Array<{url: string, alt: string, id?: string, isNew?: boolean, file?: File}>}
   */
  let images = [];
  
  /**
   * 현재 표시 중인 이미지 인덱스
   * @type {number}
   */
  let current = 0;
  
  /**
   * 첫 번째 신규 이미지에서 추출된 GPS 정보
   * @type {Object|null}
   */
  let gpsFromImg = null;
  
  /**
   * 기존 이미지에서 추출된 GPS 정보
   * @type {Object|null}
   */
  let gpsFromExistingImg = null;

  /**
   * 수정 모달의 모든 기능을 초기화하는 메인 함수
   * post_detail.js에서 모달이 로드된 후 호출됩니다.
   * 
   * @description
   * - 갤러리 초기화
   * - 이미지 편집 도구 초기화
   * - 폼 제출 기능 초기화
   */
  function initializePostEdit() {
    const modal = document.getElementById('postEditModal');
    const form = document.getElementById('postEditForm');
    const locationInput = document.getElementById('locationInput');
    const thumbs = modal ? modal.querySelectorAll('.thumb') : [];
    
    initEditGallery();
    initImageEditTools();
    initFormSubmit();
    
    // 기존 이미지에서 GPS 추출
    setTimeout(() => {
      extractGpsFromExistingImages();
    }, 100);
    
    // 자동완성은 약간 지연 후 실행
    setTimeout(() => {
      initLocationAutocomplete();
    }, 500);
    
  }

  /**
   * 갤러리 기능을 초기화합니다
   * 
   * @description
   * - DOM에서 기존 이미지 정보를 수집
   * - 이벤트 위임을 통한 클릭 이벤트 바인딩
   * - 중복 이벤트 리스너 방지
   */
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
    if (!root) {
      return;
    }

    // 기존 리스너가 있다면 제거하여 중복 방지
    if (root.handleClickDeleted) {
      root.removeEventListener('click', root.handleClickDeleted);
    }

    // 새 리스너 저장 및 등록
    root.handleClickDeleted = handleClickDeleted;
    root.addEventListener('click', root.handleClickDeleted);
  }

  /**
   * DOM에서 썸네일 정보를 읽어 images 배열을 구성합니다
   * 
   * @description
   * - 썸네일 img 요소들을 스캔
   * - 각 이미지의 URL, alt, id 정보를 추출
   * - 빈 URL인 이미지는 필터링하여 제외
   */
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

  /**
   * 이벤트 위임을 통한 클릭 이벤트 처리
   * 
   * @param {Event} e - 클릭 이벤트 객체
   * @description
   * - 삭제 버튼: 썸네일 삭제 처리
   * - 썸네일: 해당 이미지로 이동
   * - 네비게이션 버튼: 이전/다음 이미지로 이동
   * - 추가 버튼: 파일 선택 대화상자 열기
   */
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

  

  /**
   * 현재 인덱스 기준으로 UI를 업데이트합니다
   * 
   * @description
   * - 메인 이미지 교체 (페이드 효과 포함)
   * - 썸네일 활성화 상태 업데이트
   * - 네비게이션 버튼 표시/숨김 처리
   * - 썸네일 인덱스 재정렬
   * - 추가 버튼 표시 상태 업데이트
   */
  function updateUI() {
    const modal = document.getElementById('postEditModal');
    if (!modal) {
      return;
    }

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
    if (prev) {
      prev.style.display = multi ? 'flex' : 'none';
    }
    if (next) {
      next.style.display = multi ? 'flex' : 'none';
    }

    reindexThumbs();
    updateAddButtonVisibility();
  }

  /**
   * 이전 이미지로 이동합니다
   * 
   * @description
   * - 현재 인덱스를 1 감소시킴 (순환)
   * - 이미지가 2개 이상일 때만 동작
   * - UI 업데이트 호출
   */
  function prevImage() {
    if (images.length > 1) {
      current = (current - 1 + images.length) % images.length;
      updateUI();
    }
  }

  /**
   * 다음 이미지로 이동합니다
   * 
   * @description
   * - 현재 인덱스를 1 증가시킴 (순환)
   * - 이미지가 2개 이상일 때만 동작
   * - UI 업데이트 호출
   */
  function nextImage() {
    if (images.length > 1) {
      current = (current + 1) % images.length;
      updateUI();
    }
  }

  /**
   * 특정 인덱스의 이미지를 표시합니다
   * 
   * @param {number} i - 표시할 이미지의 인덱스
   * @description
   * - 유효한 인덱스인지 검증
   * - 현재 인덱스를 지정된 값으로 설정
   * - UI 업데이트 호출
   */
  function showImage(i) {
    if (i >= 0 && i < images.length) {
      current = i;
      updateUI();
    }
  }

  /**
   * 이미지 편집 도구를 초기화합니다
   * 
   * @description
   * - 파일 입력 요소에 change 이벤트 리스너 등록
   * - 중복 리스너 등록 방지
   */
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

  /**
   * 파일 선택 시 처리 함수
   * 
   * @param {Event} e - 파일 입력 change 이벤트
   * @description
   * - 선택된 파일들을 배열로 변환
   * - 최대 3장 제한 검증
   * - 각 파일에 대해 유효성 검사 후 썸네일 생성
   */
  async function onFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    const existing = document.querySelectorAll(
        '#postEditModal .thumb:not(.thumb-add-btn)').length;

    if (existing + files.length > 3) {
      alert('이미지는 최대 3장까지만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }

    for (const file of files) {
      const isValid = await validateFile(file);
      if (!isValid) {
        e.target.value = '';
        continue;
      }
      const reader = new FileReader();
      reader.onload = ev => addNewThumb(ev.target.result, file);
      reader.readAsDataURL(file);
    }
  }

  /**
   * 업로드할 파일의 유효성을 검사합니다
   * 
   * @param {File} file - 검사할 파일 객체
   * @returns {Promise<boolean>} 유효한 파일이면 true, 그렇지 않으면 false
   * @description
   * - 지원 형식: JPEG, JPG, PNG, GIF, WebP
   * - 최대 크기: 50MB
   * - GPS 메타데이터 검증 (JPEG만)
   * - 유효하지 않은 경우 사용자에게 알림 표시
   */
  async function validateFile(file) {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'image/webp'];
    const max = 50 * 1024 * 1024;
    
    if (!ok.includes(file.type)) {
      alert(`${file.name}: 지원하지 않는 형식입니다.`);
      return false;
    }
    if (file.size > max) {
      alert(`${file.name}: 파일 크기가 50MB를 초과합니다.`);
      return false;
    }

    // JPEG 파일인 경우 GPS 메타데이터 검증
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      const hasGps = await validateImageGps(file);
      if (!hasGps) {
        alert(`${file.name}: GPS 정보가 없는 사진입니다. 문화유산 방문 시 찍은 사진을 업로드해주세요.`);
        return false;
      }
      
      // 첫 번째 신규 이미지에서 GPS 추출
      if (gpsFromImg === null) {
        await extractGpsFromImage(file);
      }
    }
    
    return true;
  }

  /**
   * 이미지 파일의 GPS 메타데이터를 검증합니다
   * @param {File} file - 검사할 이미지 파일
   * @returns {Promise<boolean>} GPS 정보가 있으면 true
   */
  function validateImageGps(file) {
    return new Promise((resolve) => {
      if (typeof EXIF === 'undefined') {
        resolve(true); // EXIF 라이브러리 없으면 패스
        return;
      }

      EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lng = EXIF.getTag(this, 'GPSLongitude');
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');
        
        const hasGps = lat && lng && latRef && lngRef;
        resolve(hasGps);
      });
    });
  }
  
  /**
   * 이미지에서 GPS 정보를 추출합니다
   * @param {File} file - GPS 정보를 추출할 이미지 파일
   * @returns {Promise<void>}
   */
  function extractGpsFromImage(file) {
    return new Promise((resolve) => {
      if (typeof EXIF === 'undefined') {
        gpsFromImg = null;
        resolve();
        return;
      }

      EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lng = EXIF.getTag(this, 'GPSLongitude');
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');
        
        if (!lat || !lng || !latRef || !lngRef) {
          gpsFromImg = null;
          resolve();
          return;
        }
        
        const toDec = (dms, ref) => (dms[0] + dms[1] / 60 + dms[2] / 3600)
            * (['S', 'W'].includes(ref) ? -1 : 1);
        gpsFromImg = {
          lat: toDec(lat, latRef || 'N'),
          lng: toDec(lng, lngRef || 'E')
        };
        resolve();
      });
    });
  }
  
  /**
   * 두 지점 간의 거리를 계산합니다 (Haversine formula)
   * @param {Object} a - 첫 번째 지점 {lat, lng}
   * @param {Object} b - 두 번째 지점 {lat, lng}
   * @returns {number} 두 지점 간의 거리 (미터)
   */
  function haversine(a, b) {
    const R = 6371000, rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    return 2 * R * Math.asin(Math.sqrt(
        Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat))
        * Math.sin(dLng / 2) ** 2
    ));
  }

  /**
   * 새로운 썸네일을 생성하고 DOM에 추가합니다
   * 
   * @param {string} dataUrl - 이미지 데이터 URL
   * @param {File} file - 원본 파일 객체
   * @description
   * - 썸네일 요소 생성 (이미지 + 삭제 버튼)
   * - 추가 버튼 앞에 삽입
   * - images 배열에 새 이미지 정보 추가
   * - 첫 번째 이미지인 경우 갤러리 표시
   */
  function addNewThumb(dataUrl, file) {
    const thumbsContainer = document.querySelector(
        '#postEditModal .gallery-thumbs');
    if (!thumbsContainer) {
      return;
    }

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

    // 새 이미지를 추가 버튼 앞에 삽입 (기존 이미지들 뒤, 추가 버튼 앞)
    const addBtn = thumbsContainer.querySelector('.thumb-add-btn');
    if (addBtn) {
      thumbsContainer.insertBefore(btn, addBtn);
    } else {
      thumbsContainer.appendChild(btn);
    }

    // 새 이미지를 배열의 맨 뒤에 추가 (기존 이미지 순서 보장)
    images.push({url: dataUrl, alt: img.alt, isNew: true, file: file});
    
    if (images.length === 1) {
      current = 0;
    }

    updateUI();
  }

  /**
   * 썸네일 삭제 처리
   * 
   * @param {HTMLElement} delBtn - 삭제 버튼 요소
   * @description
   * - 기존 이미지: keepImages input 제거 (서버가 삭제로 인식)
   * - 새 이미지: DOM에서만 제거
   * - images 배열에서 해당 이미지 제거
   * - current 인덱스 조정
   * - UI 업데이트 또는 빈 이미지 상태 표시
   */
  function onDeleteThumb(delBtn) {
    const thumb = delBtn.closest('.thumb');
    if (!thumb) {
      return;
    }

    // 현재 이미지 개수 확인 (최소 1장 보장)
    const modal = document.getElementById('postEditModal');
    const currentImageCount = modal ? modal.querySelectorAll('.thumb:not(.thumb-add-btn)').length : 0;
    
    
    if (currentImageCount <= 1) {
      alert('최소 1장의 이미지는 유지해야 합니다.');
      return;
    }

    const imageId = delBtn.dataset.imageId;
    const isNew = delBtn.hasAttribute('data-new-image');
    const idx = parseInt(thumb.dataset.index);

    // 기존 이미지인 경우, 해당 이미지의 'keepImages' input을 DOM에서 제거.
    // 백엔드는 이 ID가 없으면 해당 이미지가 삭제되었다고 판단합니다.
    if (imageId && !isNew) {
      thumb.querySelector('.keep-image-input')?.remove();
    }

    thumb.remove();

    // 이미지 배열에서 해당 이미지 제거
    if (!Number.isNaN(idx) && images[idx]) {
      images.splice(idx, 1);
      if (current >= images.length) {
        current = Math.max(0, images.length - 1);
      }
    }

    // UI 업데이트
    if (images.length === 0) {
      showNoImage();
    } else {
      updateUI();
    }
  }

  /**
   * 썸네일들의 인덱스를 재정렬합니다
   * 
   * @description
   * - 각 썸네일의 data-index 속성을 순차적으로 설정
   * - 이미지의 alt 텍스트도 인덱스에 맞게 업데이트
   */
  function reindexThumbs() {
    document.querySelectorAll(
        '#postEditModal .thumb:not(.thumb-add-btn)').forEach((t, i) => {
      t.dataset.index = i;
      const img = t.querySelector('img');
      if (img) {
        img.alt = `이미지 ${i + 1}`;
      }
    });
  }

  /**
   * 추가 버튼의 표시/숨김 상태를 업데이트합니다
   * 
   * @description
   * - 이미지가 3장 이상이면 추가 버튼 숨김
   * - 3장 미만이면 추가 버튼 표시
   */
  function updateAddButtonVisibility() {
    const addBtn = document.querySelector('#postEditModal .thumb-add-btn');
    const count = document.querySelectorAll(
        '#postEditModal .thumb:not(.thumb-add-btn)').length;
    if (addBtn) {
      addBtn.style.display = count >= 3 ? 'none' : 'flex';
    }
  }

  /**
   * 갤러리를 표시하고 빈 이미지 상태를 숨깁니다
   * 
   * @description
   * - .gallery 요소를 표시
   * - .no-image 요소를 숨김
   */
  function showGallery() {
    const modal = document.getElementById('postEditModal');
    if (!modal) {
      return;
    }
    const g = modal.querySelector('.gallery');
    const n = modal.querySelector('.no-image');
    if (g) {
      g.style.display = 'block';
    }
    if (n) {
      n.style.display = 'none';
    }
  }

  /**
   * 빈 이미지 상태를 표시하고 갤러리를 숨깁니다
   * 
   * @description
   * - .gallery 요소를 숨김
   * - .no-image 요소를 표시
   */
  function showNoImage() {
    const modal = document.getElementById('postEditModal');
    if (!modal) {
      return;
    }
    const g = modal.querySelector('.gallery');
    const n = modal.querySelector('.no-image');
    if (g) {
      g.style.display = 'none';
    }
    if (n) {
      n.style.display = 'flex';
    }
  }

  /**
   * 폼 제출 기능을 초기화합니다
   * 
   * @description
   * - 폼 submit 이벤트 리스너 등록
   * - AJAX를 통한 비동기 제출 처리
   * - 중복 리스너 등록 방지
   */
  function initFormSubmit() {
    const form = document.getElementById('postEditForm');
    
    if (!form) {
      return;
    }

    // 리스너 중복 방지
    if (form.hasSubmitListener) {
      form.removeEventListener('submit', form.submitHandler);
    }
    /**
     * 폼 제출 이벤트 핸들러
     * 
     * @param {Event} e - 폼 submit 이벤트
     * @description
     * - 기본 폼 제출 동작 방지
     * - FormData 생성 및 새 이미지 파일 추가
     * - CSRF 토큰 포함하여 AJAX 요청
     * - 성공 시 모달 닫기 및 상세 모달 새로고침
     * - 실패 시 오류 메시지 표시
     */
    form.submitHandler = async (e) => {
      e.preventDefault();
      const modal = document.getElementById('postEditModal');
      const postId = modal?.dataset.postId;
      if (!postId) {
        alert('게시글 ID를 찾을 수 없습니다.');
        return;
      }

      try {
        // 최소 1장 이미지 검증
        const modal = document.getElementById('postEditModal');
        const totalImages = modal ? modal.querySelectorAll('.thumb:not(.thumb-add-btn)').length : 0;
        
        
        if (totalImages === 0) {
          alert('최소 1장의 이미지가 필요합니다.');
          return;
        }
        
        // GPS 검증 (신규 이미지 또는 기존 이미지)
        const hasNewImages = images.some(img => img.isNew);
        let referenceGps = null;
        
        if (hasNewImages) {
          // 신규 이미지가 있는 경우: 신규 이미지의 GPS 사용
          if (!gpsFromImg) {
            alert('업로드한 사진에 위치 정보가 없습니다.\nGPS 기능이 켜진 상태에서 촬영한 사진을 업로드해주세요.');
            return;
          }
          referenceGps = gpsFromImg;
        } else if (gpsFromExistingImg) {
          // 신규 이미지가 없고 기존 이미지에 GPS가 있는 경우: 기존 이미지의 GPS 사용
          referenceGps = gpsFromExistingImg;
        }
        
        // GPS 정보가 있으면 위치와의 거리 검증
        if (referenceGps) {
          // 위치 입력 확인
          const locationInput = modal.querySelector('#locationInput') || modal.querySelector('input[name="location"]');
          const latHidden = modal.querySelector('#latHidden') || modal.querySelector('input[name="lat"]');
          const lngHidden = modal.querySelector('#lngHidden') || modal.querySelector('input[name="lng"]');
          
          if (!locationInput?.value.trim()) {
            alert('위치를 선택해주세요.');
            return;
          }
          
          const selectedLat = parseFloat(latHidden?.value);
          const selectedLng = parseFloat(lngHidden?.value);
          
          // 200m 이내 거리 검증
          if (!isNaN(selectedLat) && !isNaN(selectedLng)) {
            const distance = haversine(referenceGps, {lat: selectedLat, lng: selectedLng});
            if (distance > 200) {
              alert('사진의 GPS 위치와 선택한 장소가 200m 이상 차이납니다.\n사진이 촬영된 위치와 일치하는 장소를 선택해주세요.');
              return;
            }
          }
        }

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
        
        // Content 값 강제 업데이트 (textarea DOM 값 우선)
        const contentTextarea = form.querySelector('textarea[name="content"]');
        if (contentTextarea?.value) {
          fd.set('content', contentTextarea.value);
        }
        
        // GPS 좌표 확인 및 강제 설정
        const latHidden = modal.querySelector('#latHidden') || modal.querySelector('input[name="lat"]');
        const lngHidden = modal.querySelector('#lngHidden') || modal.querySelector('input[name="lng"]');
        
        if (latHidden?.value) {
          fd.set('lat', latHidden.value);
        }
        if (lngHidden?.value) {
          fd.set('lng', lngHidden.value);
        }
        
        // GPS 좌표가 없고 기존 이미지에 GPS가 있으면 기존 GPS 사용
        if ((!latHidden?.value || !lngHidden?.value) && gpsFromExistingImg) {
          if (latHidden) latHidden.value = gpsFromExistingImg.lat;
          if (lngHidden) lngHidden.value = gpsFromExistingImg.lng;
          fd.set('lat', gpsFromExistingImg.lat);
          fd.set('lng', gpsFromExistingImg.lng);
        }

        // 새 이미지 파일들을 FormData에 수동으로 추가
        // JS의 `images` 배열은 새로 업로드된 파일 객체들을 가지고 있습니다.
        // 기존 이미지가 아닌 (id 속성이 없는) 새 이미지들만 필터링하여 추가합니다.
        images.filter(img => img.isNew && img.file).forEach((img, index) => {
          fd.append('images', img.file, img.file.name);
        });

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
          if (window.PostListManager
              && typeof window.PostListManager.clearPostCache === 'function') {
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
              if (window.toastManager) {
                window.toastManager.show('게시글이 성공적으로 수정되었습니다.', 'success');
              }
            }, 250);
          }

        } else {
          throw new Error('수정 중 오류가 발생했습니다.');
        }

      } catch (err) {
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

  /**
   * 위치 자동완성을 초기화합니다 (수정 모달 전용)
   */
  async function initLocationAutocomplete() {
    // 모달 내에서만 찾기 (ID 중복 방지)
    const modal = document.getElementById('postEditModal');
    if (!modal) {
      return;
    }
    
    const locationInput = modal.querySelector('#locationInput') || modal.querySelector('input[name="location"]');
    
    if (!locationInput) {
      return;
    }

    // 이미 자동완성이 적용된 경우 스킵
    if (locationInput._autocompleteInstance) {
      return;
    }

    // Google Maps API 대기 및 직접 초기화
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryInitAutocomplete = async () => {
      attempts++;
      
      if (typeof google === 'undefined' || !google.maps) {
        if (attempts < maxAttempts) {
          setTimeout(tryInitAutocomplete, 1000);
        }
        return;
      }

      try {
        
        // Places 라이브러리 로드
        const { Autocomplete } = await google.maps.importLibrary('places');
        
        // 기존 자동완성 제거 (혹시 있다면)
        if (window.autocomplete) {
          google.maps.event.clearInstanceListeners(window.autocomplete);
        }
        
        // 새 자동완성 생성
        const autocomplete = new Autocomplete(locationInput, {
          componentRestrictions: { country: 'kr' },
          fields: ['formatted_address', 'geometry']
        });

        // 이벤트 리스너
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // 숨겨진 좌표 필드에 설정 (모달 내에서 찾기)
            const latHidden = modal.querySelector('#latHidden') || modal.querySelector('input[name="lat"]');
            const lngHidden = modal.querySelector('#lngHidden') || modal.querySelector('input[name="lng"]');
            
            if (latHidden) latHidden.value = lat;
            if (lngHidden) lngHidden.value = lng;
          }
        });
        
        // 인스턴스 저장하여 중복 방지
        locationInput._autocompleteInstance = autocomplete;
        window.editAutocomplete = autocomplete;
        
      } catch (error) {
        // 자동완성 초기화 실패 시 조용히 처리
      }
    };
    
    tryInitAutocomplete();
  }

  /**
   * 기존 이미지에서 GPS 정보를 추출합니다
   */
  async function extractGpsFromExistingImages() {
    if (images.length === 0) {
      return;
    }
    
    // 기존 이미지 중 첫 번째에서 GPS 추출 (신규 이미지가 아닌 것)
    const existingImage = images.find(img => !img.isNew);
    if (!existingImage) {
      return;
    }
    
    try {
      // 이미지 URL에서 파일을 가져와서 GPS 추출
      const response = await fetch(existingImage.url);
      const blob = await response.blob();
      
      gpsFromExistingImg = await extractGpsFromBlob(blob);
    } catch (error) {
      gpsFromExistingImg = null;
    }
  }
  
  /**
   * Blob에서 GPS 정보를 추출합니다
   * @param {Blob} blob - GPS 정보를 추출할 이미지 Blob
   * @returns {Promise<Object|null>} GPS 좌표 {lat, lng} 또는 null
   */
  function extractGpsFromBlob(blob) {
    return new Promise((resolve) => {
      if (typeof EXIF === 'undefined') {
        resolve(null);
        return;
      }

      EXIF.getData(blob, function() {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lng = EXIF.getTag(this, 'GPSLongitude');
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');
        
        if (!lat || !lng || !latRef || !lngRef) {
          resolve(null);
          return;
        }
        
        const toDec = (dms, ref) => (dms[0] + dms[1] / 60 + dms[2] / 3600)
            * (['S', 'W'].includes(ref) ? -1 : 1);
        const gps = {
          lat: toDec(lat, latRef || 'N'),
          lng: toDec(lng, lngRef || 'E')
        };
        resolve(gps);
      });
    });
  }

  /**
   * 전역 스코프에 초기화 함수 노출
   * post_detail.js에서 모달 로드 후 호출할 수 있도록 함
   */
  window.initializePostEdit = initializePostEdit;
})();