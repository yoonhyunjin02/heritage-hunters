/**
 * 게시글 수정 - 완전히 새로 설계된 간단한 이미지 관리 시스템
 */

(function () {
  let originalImages = [];  // 서버에서 온 원본 이미지들 (절대 변경되지 않음)
  let newImages = [];       // 새로 추가된 이미지들만
  
  let currentIndex = 0;
  let gpsFromNewImage = null;
  let gpsFromOriginalImage = null;  // 기존 이미지의 GPS 정보

  function initializePostEdit() {
    console.log('=== 새로운 이미지 시스템 초기화 시작 ===');

    // 매번 새로 초기화 (모달이 열릴 때마다)
    originalImages = [];
    newImages = [];
    currentIndex = 0;
    gpsFromNewImage = null;
    gpsFromOriginalImage = null;
    
    console.log('배열 초기화 완료');

    // 1. 원본 이미지 데이터 수집 (한 번만, 변경되지 않음)
    collectOriginalImages();

    // 2. 이벤트 리스너 설정
    setupEventListeners();

    // 3. UI 초기화
    updateDisplay();

    // 4. 기존 이미지에서 GPS 추출
    setTimeout(() => {
      extractGpsFromOriginalImages();
    }, 100);

    // 5. 폼 및 기타 기능 초기화
    initFormAndOthers();

    console.log('=== 초기화 완료 - 원본 이미지:', originalImages.length, '===');
  }

  // 서버에서 온 원본 이미지들만 한 번 수집 (절대 변경되지 않음)
  function collectOriginalImages() {
    const thumbs = document.querySelectorAll(
        '#postEditModal .thumb[data-original="true"]');
    originalImages = [];

    console.log('=== 원본 이미지 수집 시작 ===');
    console.log('찾은 data-original="true" 썸네일:', thumbs.length, '개');

    thumbs.forEach((thumb, index) => {
      const img = thumb.querySelector('img');
      const input = thumb.querySelector('.keep-image-input');
      
      console.log(`썸네일 ${index + 1}:`, {
        img존재: !!img,
        input존재: !!input,
        imageId: input?.value,
        imageUrl: img?.src
      });
      
      if (img && input) {
        originalImages.push({
          id: input.value,
          url: img.dataset.full || img.src,
          alt: img.alt
        });
      }
    });

    console.log('원본 이미지 수집 완료:', originalImages.length, '장');
    console.log('원본 이미지 ID들:', originalImages.map(img => img.id));
  }

  function setupEventListeners() {
    const modal = document.getElementById('postEditModal');
    if (!modal) {
      return;
    }

    // 기존 리스너 제거 (중복 방지)
    if (modal._postEditHandler) {
      modal.removeEventListener('click', modal._postEditHandler);
      console.log('기존 클릭 리스너 제거됨');
    }

    // 새 리스너 등록
    modal._postEditHandler = handleClick;
    modal.addEventListener('click', modal._postEditHandler);
    console.log('새 클릭 리스너 등록됨');

    // 파일 입력은 이제 동적 생성하므로 여기서 설정하지 않음
    console.log('파일 입력은 동적 생성 방식 사용');
  }

  function handleClick(e) {
    // 삭제 버튼
    if (e.target.closest('.thumb-delete-btn')) {
      e.preventDefault();
      handleDelete(e.target.closest('.thumb-delete-btn'));
      return;
    }

    // 썸네일 클릭 (이미지 변경)
    const thumb = e.target.closest('.thumb:not(.thumb-add-btn)');
    if (thumb) {
      e.preventDefault();
      const index = parseInt(thumb.dataset.index);
      if (!isNaN(index)) {
        currentIndex = index;
        updateDisplay();
      }
      return;
    }

    // 네비게이션
    if (e.target.closest('.gallery-nav.prev')) {
      e.preventDefault();
      navigateImage(-1);
      return;
    }
    if (e.target.closest('.gallery-nav.next')) {
      e.preventDefault();
      navigateImage(1);
      return;
    }

    // 이미지 추가 버튼
    if (e.target.closest('.thumb-add-btn')) {
      e.preventDefault();
      createAndClickFileInput();
      return;
    }
  }

  function navigateImage(direction) {
    const totalImages = getAllImages().length;
    if (totalImages <= 1) {
      return;
    }

    currentIndex = (currentIndex + direction + totalImages) % totalImages;
    updateDisplay();
  }

  // 원본 + 새 이미지를 합친 전체 이미지 배열
  function getAllImages() {
    return [...originalImages, ...newImages];
  }

  // UI 전체 업데이트
  function updateDisplay() {
    const allImages = getAllImages();

    console.log('디스플레이 업데이트:', {
      원본: originalImages.length,
      새이미지: newImages.length,
      전체: allImages.length,
      현재인덱스: currentIndex
    });

    // 메인 이미지 업데이트
    updateMainImage(allImages);

    // 썸네일 재생성
    rebuildThumbnails(allImages);

    // 네비게이션 버튼
    updateNavButtons(allImages.length > 1);

    // 추가 버튼 표시/숨김
    updateAddButton(allImages.length < 3);
  }

  // 완전히 새로운 파일 입력 생성 (브라우저 캐싱 문제 해결)
  function createAndClickFileInput() {
    const totalImages = getAllImages().length;
    
    if (totalImages >= 3) {
      alert('이미지는 최대 3장까지만 업로드할 수 있습니다.');
      return;
    }
    
    // 기존 임시 입력 제거
    const existingTemp = document.getElementById('tempImageInput');
    if (existingTemp) {
      existingTemp.remove();
    }
    
    // 완전히 새로운 파일 입력 생성
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'tempImageInput';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', handleSingleFileSelect);
    
    document.body.appendChild(input);
    input.click();
    
    console.log('새로운 파일 입력 생성 및 클릭');
  }

  async function handleSingleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    
    console.log('=== 단일 파일 선택 시작 ===');
    console.log('선택된 파일:', files.length, '개');
    console.log('파일 이름들:', files.map(f => f.name));
    console.log('현재 newImages 배열:', newImages.length, '개');

    if (files.length === 0) {
      console.log('선택된 파일이 없음');
      e.target.remove(); // 임시 입력 제거
      return;
    }

    const file = files[0]; // 첫 번째 파일만 처리
    
    // 중복 파일 체크
    const alreadyExists = newImages.some(img => 
      img.file && img.file.name === file.name && img.file.size === file.size && img.file.lastModified === file.lastModified
    );
    
    if (alreadyExists) {
      console.log('이미 추가된 파일:', file.name);
      e.target.remove(); // 임시 입력 제거
      return;
    }

    try {
      console.log('처리 중인 파일:', file.name);
      
      const isValid = await validateFile(file);
      if (!isValid) {
        console.log('유효하지 않은 파일:', file.name);
        e.target.remove(); // 임시 입력 제거
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);

      // 새 이미지 추가
      newImages.push({
        file: file,
        url: dataUrl,
        alt: `새 이미지: ${file.name}`
      });

      console.log('새 이미지 추가 완료:', file.name, '-> newImages 길이:', newImages.length);

    } catch (error) {
      console.error('파일 처리 오류:', error);
    }

    e.target.remove(); // 임시 입력 제거
    console.log('=== 단일 파일 선택 완료, newImages 최종:', newImages.length, '개 ===');
    updateDisplay();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      alert(`${file.name}: 지원하지 않는 형식입니다.`);
      return false;
    }

    if (file.size > maxSize) {
      alert(`${file.name}: 파일 크기가 50MB를 초과합니다.`);
      return false;
    }

    // JPEG 파일인 경우 GPS 검증
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      const hasGps = await checkGps(file);
      if (!hasGps) {
        alert(`${file.name}: GPS 정보가 없는 사진입니다. 문화유산 방문 시 찍은 사진을 업로드해주세요.`);
        return false;
      }

      // 동적 GPS 추출을 사용하므로 여기서는 GPS 저장하지 않음
      console.log('GPS는 제출 시 동적으로 추출됩니다');
    }

    return true;
  }

  function checkGps(file) {
    return new Promise((resolve) => {
      if (typeof EXIF === 'undefined') {
        resolve(true);
        return;
      }

      EXIF.getData(file, function () {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lng = EXIF.getTag(this, 'GPSLongitude');
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

        resolve(lat && lng && latRef && lngRef);
      });
    });
  }

  function extractGpsFromFile(file) {
    return new Promise((resolve) => {
      if (typeof EXIF === 'undefined') {
        resolve(null);
        return;
      }

      EXIF.getData(file, function () {
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
        resolve({
          lat: toDec(lat, latRef || 'N'),
          lng: toDec(lng, lngRef || 'E')
        });
      });
    });
  }

  function haversine(a, b) {
    const R = 6371000;
    const rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    return 2 * R * Math.asin(Math.sqrt(
        Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat))
        * Math.sin(dLng / 2) ** 2
    ));
  }

  function handleDelete(deleteBtn) {
    const thumb = deleteBtn.closest('.thumb');
    if (!thumb) {
      return;
    }

    const index = parseInt(thumb.dataset.index);
    if (isNaN(index)) {
      return;
    }

    const allImages = getAllImages();
    if (allImages.length <= 1) {
      alert('최소 1장의 이미지는 유지해야 합니다.');
      return;
    }

    const imageToDelete = allImages[index];

    if (imageToDelete.id) {
      // 원본 이미지 삭제: originalImages에서도 실제로 제거
      const originalIndex = originalImages.findIndex(img => img.id === imageToDelete.id);
      if (originalIndex !== -1) {
        originalImages.splice(originalIndex, 1);
        console.log('원본 이미지 삭제 완료:', imageToDelete.id, '-> 남은 원본:', originalImages.length, '장');
      }
    } else {
      // 새 이미지 삭제: newImages에서 제거
      const newIndex = index - originalImages.length; // 이제 originalImages.length가 정확함
      if (newIndex >= 0 && newIndex < newImages.length) {
        newImages.splice(newIndex, 1);
        console.log('새 이미지 삭제:', newIndex, '-> 남은 새 이미지:', newImages.length, '장');
      }
    }

    // 현재 인덱스 조정
    const remainingCount = getAllImages().length;
    if (currentIndex >= remainingCount) {
      currentIndex = Math.max(0, remainingCount - 1);
    }

    updateDisplay();
  }

  // UI 헬퍼 함수들
  function updateMainImage(allImages) {
    const mainImage = document.querySelector('#postEditModal #mainImage');
    if (!mainImage || allImages.length === 0) {
      return;
    }

    const currentImage = allImages[currentIndex] || allImages[0];
    if (currentImage) {
      mainImage.src = currentImage.url;
      mainImage.alt = currentImage.alt;
    }
  }

  function rebuildThumbnails(allImages) {
    const container = document.querySelector('#postEditModal .gallery-thumbs');
    if (!container) {
      return;
    }

    // 기존 썸네일들 제거 (추가 버튼 제외)
    container.querySelectorAll('.thumb:not(.thumb-add-btn)').forEach(
        el => el.remove());

    const addButton = container.querySelector('.thumb-add-btn');

    // 새 썸네일들 생성
    allImages.forEach((image, index) => {
      const thumb = createThumbnailElement(image, index);
      if (addButton) {
        container.insertBefore(thumb, addButton);
      } else {
        container.appendChild(thumb);
      }
    });
  }

  function createThumbnailElement(image, index) {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.dataset.index = index;
    if (index === currentIndex) {
      thumb.classList.add('active');
    }

    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.alt;
    img.dataset.full = image.url;

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'thumb-delete-btn edit-only';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('role', 'button');
    deleteBtn.setAttribute('tabindex', '0');
    deleteBtn.setAttribute('title', '삭제');

    if (image.id) {
      // 원본 이미지 - keep-image-input 유지
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.className = 'keep-image-input';
      hiddenInput.value = image.id;
      thumb.appendChild(hiddenInput);
    }

    thumb.appendChild(img);
    thumb.appendChild(deleteBtn);

    return thumb;
  }

  function updateNavButtons(show) {
    const prev = document.querySelector('#postEditModal .gallery-nav.prev');
    const next = document.querySelector('#postEditModal .gallery-nav.next');

    if (prev) {
      prev.style.display = show ? 'flex' : 'none';
    }
    if (next) {
      next.style.display = show ? 'flex' : 'none';
    }
  }

  function updateAddButton(show) {
    const addBtn = document.querySelector('#postEditModal .thumb-add-btn');
    if (addBtn) {
      addBtn.style.display = show ? 'flex' : 'none';
    }
  }

  function initFormAndOthers() {
    initFormSubmit();
    setTimeout(() => {
      initLocationAutocomplete();
    }, 500);
  }

  function initFormSubmit() {
    const form = document.getElementById('postEditForm');
    if (!form) {
      return;
    }

    // 기존 리스너 제거
    if (form._submitHandler) {
      form.removeEventListener('submit', form._submitHandler);
    }

    form._submitHandler = async (e) => {
      e.preventDefault();

      const modal = document.getElementById('postEditModal');
      const postId = modal?.dataset.postId;
      if (!postId) {
        alert('게시글 ID를 찾을 수 없습니다.');
        return;
      }

      try {
        const allImages = getAllImages();

        // 최소 1장 검증
        if (allImages.length === 0) {
          alert('최소 1장의 이미지가 필요합니다.');
          return;
        }

        // GPS 검증 로직 개선
        const locationInput = modal.querySelector('#locationInput');
        const latHidden = modal.querySelector('#latHidden');
        const lngHidden = modal.querySelector('#lngHidden');
        
        if (!locationInput?.value.trim()) {
          alert('위치를 선택해주세요.');
          return;
        }
        
        const selectedLat = parseFloat(latHidden?.value);
        const selectedLng = parseFloat(lngHidden?.value);
        
        if (isNaN(selectedLat) || isNaN(selectedLng)) {
          alert('위치 좌표를 확인할 수 없습니다. 위치를 다시 선택해주세요.');
          return;
        }
        
        // GPS 검증 로직 - 현재 첫 번째 이미지에서 동적으로 GPS 추출
        let referenceGps = null;
        const finalImages = getAllImages();
        
        if (finalImages.length > 0) {
          console.log('현재 첫 번째 이미지에서 GPS 추출 시작...');
          referenceGps = await getCurrentFirstImageGps(finalImages[0]);
          
          if (!referenceGps) {
            const imageType = finalImages[0].id ? '기존' : '새로 추가한';
            alert(`${imageType} 사진에 GPS 위치 정보가 없습니다.\nGPS 기능이 켜진 상태에서 촬영한 사진을 업로드해주세요.`);
            return;
          }
          
          console.log('현재 첫 번째 이미지 GPS:', referenceGps);
        } else {
          console.log('이미지가 없음 - 위치 검증 생략');
        }
        
        // GPS가 있으면 200m 거리 검증
        if (referenceGps) {
          const distance = haversine(referenceGps, {lat: selectedLat, lng: selectedLng});
          console.log('GPS 거리 검증:', distance + 'm');
          
          if (distance > 200) {
            const imageType = newImages.length > 0 ? '업로드한' : '기존';
            alert(`${imageType} 사진의 GPS 위치와 선택한 장소가 ${Math.round(distance)}m 차이납니다.\n200m 이내의 장소를 선택해주세요.`);
            return;
          }
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '수정 중...';
        }

        const fd = new FormData(form);

        // 기존 images 필드 제거 (HTML 폼에서 자동으로 추가된 것)
        fd.delete('images');
        
        // 새 이미지들만 수동으로 추가 (중복 방지)
        newImages.forEach(image => {
          if (image.file) {
            fd.append('images', image.file, image.file.name);
            console.log('FormData에 새 이미지 추가:', image.file.name);
          }
        });

        // 유지할 기존 이미지 ID들 추가
        originalImages.forEach(image => {
          if (image.id) { // Ensure it's an original image with an ID
            fd.append('keepImages', image.id);
            console.log('FormData에 유지할 이미지 ID 추가:', image.id);
          }
        });

        console.log('폼 제출:', {
          새이미지: newImages.length,
          유지할이미지: originalImages.map(img => img.id),
          최종배열길이: finalImages.length,
          첫번째이미지타입: finalImages[0]?.id ? '기존' : '새이미지',
          동적추출GPS: referenceGps,
          선택된위치: {lat: selectedLat, lng: selectedLng}
        });

        const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
        const csrfHeader = document.querySelector(
            'meta[name="_csrf_header"]')?.content;
        const headers = {'X-Requested-With': 'XMLHttpRequest'};
        if (csrfToken && csrfHeader) {
          headers[csrfHeader] = csrfToken;
        }

        const res = await fetch(`/posts/${postId}`, {
          method: 'POST',
          headers,
          body: fd
        });

        if (res.ok) {
          if (window.PostListManager?.clearPostCache) {
            window.PostListManager.clearPostCache(String(postId));
          }

          if (window.closePostEdit) {
            window.closePostEdit();
          }

          if (window.openPostDetail) {
            setTimeout(() => {
              // 캐시 무효화를 위해 타임스탬프 추가
              const timestamp = Date.now();
              console.log('상세 모달 새로고침 with 캐시 무효화:', timestamp);
              window.openPostDetail(String(postId), { forceRefresh: true, timestamp });
              if (window.toastManager) {
                window.toastManager.show('게시글이 성공적으로 수정되었습니다.', 'success');
              }
            }, 250);
          }

        } else {
          throw new Error('수정 실패');
        }

      } catch (error) {
        console.error('폼 제출 오류:', error);
        alert('게시글 수정 중 오류가 발생했습니다.');

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '수정 완료';
        }
      }
    };

    form.addEventListener('submit', form._submitHandler);
  }

  async function initLocationAutocomplete() {
    const modal = document.getElementById('postEditModal');
    if (!modal) {
      return;
    }

    const locationInput = modal.querySelector('#locationInput');
    if (!locationInput || locationInput._autocompleteInstance) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const tryInit = async () => {
      attempts++;

      if (typeof google === 'undefined' || !google.maps) {
        if (attempts < maxAttempts) {
          setTimeout(tryInit, 1000);
        }
        return;
      }

      try {
        const {Autocomplete} = await google.maps.importLibrary('places');

        const autocomplete = new Autocomplete(locationInput, {
          componentRestrictions: {country: 'kr'},
          fields: ['formatted_address', 'geometry']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const latHidden = modal.querySelector('#latHidden');
            const lngHidden = modal.querySelector('#lngHidden');

            if (latHidden) {
              latHidden.value = lat;
            }
            if (lngHidden) {
              lngHidden.value = lng;
            }
          }
        });

        locationInput._autocompleteInstance = autocomplete;

      } catch (error) {
        // 자동완성 실패 시 조용히 처리
      }
    };

    tryInit();
  }

  // 현재 첫 번째 이미지에서 동적으로 GPS 추출
  async function getCurrentFirstImageGps(firstImage) {
    if (!firstImage) return null;
    
    try {
      if (firstImage.id) {
        // 기존 이미지인 경우
        console.log('첫 번째 이미지: 기존 이미지에서 GPS 추출 시도');
        const response = await fetch(firstImage.url);
        const blob = await response.blob();
        return await extractGpsFromBlob(blob);
      } else {
        // 새 이미지인 경우
        console.log('첫 번째 이미지: 새 이미지에서 GPS 추출 시도');
        if (firstImage.file) {
          return await extractGpsFromFile(firstImage.file);
        }
      }
    } catch (error) {
      console.log('첫 번째 이미지 GPS 추출 실패:', error);
      return null;
    }
    
    return null;
  }
  
  // 기존 이미지에서 GPS 정보 추출 (초기화용 - 더 이상 사용 안함)
  async function extractGpsFromOriginalImages() {
    // 이제 동적 추출을 사용하므로 이 함수는 빈 함수로 유지
    console.log('동적 GPS 추출 방식 사용 - 초기 추출 생략');
  }
  
  // Blob에서 GPS 정보 추출
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
        
        const toDec = (dms, ref) => (dms[0] + dms[1] / 60 + dms[2] / 3600) * (['S', 'W'].includes(ref) ? -1 : 1);
        resolve({
          lat: toDec(lat, latRef || 'N'),
          lng: toDec(lng, lngRef || 'E')
        });
      });
    });
  }

  // 전역에 노출
  window.initializePostEdit = initializePostEdit;

})();