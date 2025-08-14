// 내부 상태
const SidebarState = {
  selectedMuseumCats: new Set(),      // 문자열(카테고리)
  selectedDesignations: new Set(),    // "11","12",...
  myLocation: null,                   // {lat,lng} 있을 때만 거리 정렬 활성
};

// 어떤 문자열이 와도 DOM id로 안전한 짧은 해시
function safeId(prefix, text) {
  let h = 0x811c9dc5;                // FNV-1a 32-bit
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${prefix}_${(h >>> 0).toString(36)}`;
}

// 거리 계산(Haversine)
function distMeters(a, b){
  const toRad = d => d * Math.PI / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat/2), s2 = Math.sin(dLng/2);
  const A = s1*s1 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*s2*s2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(A)));
}

// ----- 필터 UI 빌드 -----
function buildFiltersFromData(list){
  // 고유 카테고리/종목 수집 + 카운트
  const museumCount = new Map();   // cat -> n
  const desigCount  = new Map();   // "11" -> n

  (list || []).forEach(it => {
    if (it.type === 'museum' && it.category) {
      const cat = String(it.category).trim();
      museumCount.set(cat, (museumCount.get(cat) || 0) + 1);
    }
    if (it.type === 'heritage' && it.category) {
      // "11|12" 같은 복수 처리
      String(it.category).split(/[|,/]/).map(s=>s.trim()).filter(Boolean).forEach(code => {
        desigCount.set(code, (desigCount.get(code) || 0) + 1);
      });
    }
  });

  // 박물관 카테고리
  const $mWrap = document.getElementById('museumCatList');
  if ($mWrap){
    $mWrap.innerHTML = '';
    [...museumCount.entries()]
      .sort((a,b)=>a[0].localeCompare(b[0], 'ko'))
      .forEach(([cat, n]) => {
        const id = safeId('mcat', cat);
        const row = document.createElement('label');
        row.style.display = 'flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.margin='4px 0';
        row.innerHTML = `
          <input type="checkbox" id="${id}" data-cat="${cat}">
          <span>${cat}</span>
          <span style="margin-left:auto;color:#6b7280">${n}</span>
        `;
        const box = row.querySelector('input');
        box.checked = SidebarState.selectedMuseumCats.has(cat);
        box.addEventListener('change', () => {
          box.checked ? SidebarState.selectedMuseumCats.add(cat) : SidebarState.selectedMuseumCats.delete(cat);
          requestRerender();
        });
        $mWrap.appendChild(row);
      });
  }

  // 문화재 종목 (designation_map의 라벨 순서대로 + 존재하는 것만)
  const $hWrap = document.getElementById('heritageDesignationList');
  if ($hWrap){
    $hWrap.innerHTML = '';
    const order = Object.keys(window.designationMap || {}).map(n=>String(n));
    order.forEach(code => {
      const n = desigCount.get(code) || 0;
      if (n === 0) return; // 현재 데이터에 없는 종목은 표시 생략(원하면 표시 가능)
      const id = 'hdes_' + code;
      const row = document.createElement('label');
      row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.margin='4px 0';
      row.innerHTML = `
        <input type="checkbox" id="${id}" data-code="${code}">
        <span>${window.designationMap[code] || code}</span>
        <span style="margin-left:auto;color:#6b7280">${n}</span>
      `;
      const box = row.querySelector('input');
      box.checked = SidebarState.selectedDesignations.has(code);
      box.addEventListener('change', () => {
        box.checked ? SidebarState.selectedDesignations.add(code) : SidebarState.selectedDesignations.delete(code);
        requestRerender();
      });
      $hWrap.appendChild(row);
    });
  }
}

// ----- 필터 적용 -----
function applyFilter(list){
  let out = list || [];
  // museum 카테고리
  if (SidebarState.selectedMuseumCats.size > 0){
    out = out.filter(it => {
      if (it.type !== 'museum') return true;
      const cat = (it.category ?? '').toString().trim();
      return SidebarState.selectedMuseumCats.has(cat);
    });
  }
  // heritage 종목
  if (SidebarState.selectedDesignations.size > 0){
    const hasCode = (catStr) => {
      if (!catStr) return false;
      const arr = String(catStr).split(/[|,/]/).map(s=>s.trim());
      return arr.some(code => SidebarState.selectedDesignations.has(code));
    };
    out = out.filter(it => it.type !== 'heritage' || hasCode(it.category));
  }
  return out;
}

// ----- 리스트/상태 요약 -----
function updateListHeader(list, baseList){
  const $cnt = document.getElementById('listCount');
  if ($cnt) {
    const total = (baseList||[]).length;
    const shown = (list||[]).length;
    $cnt.textContent = total === shown ? `(${shown}개)` : `(${shown}/${total}개)`;
  }

  const $btn = document.getElementById('sortByDistance');
  if ($btn){
    const canSort = Boolean(SidebarState.myLocation);
    $btn.disabled = !canSort;
    $btn.setAttribute('aria-disabled', String(!canSort));
  }
}

// 가까운 순 정렬(가능하면 서버 distanceMeters, 없으면 클라 계산)
function maybeSortByDistance(list){
  const btn = document.getElementById('sortByDistance');
  if (!btn || btn.dataset.active !== 'true') return list;

  const me = SidebarState.myLocation;
  if (!me) return list;

  const hasServerDistance = list.some(d => typeof d.distanceMeters === 'number' && d.distanceMeters > 0);
  if (hasServerDistance) {
    return [...list].sort((a,b)=>(a.distanceMeters||0)-(b.distanceMeters||0));
  }
  return [...list].sort((a,b)=>{
    const pa = {lat:a.lat, lng:a.lng}, pb = {lat:b.lat, lng:b.lng};
    return distMeters(me, pa) - distMeters(me, pb);
  });
}

// 검색 배지
function syncSearchBadge(){
  const $q = document.getElementById('search');
  const $box = document.getElementById('searchBadge');
  const $txt = document.getElementById('searchQueryText');
  if (!$q || !$box || !$txt) return;
  const v = $q.value.trim();
  const show = Boolean(v && window.searchMode);
  $box.style.display = show ? '' : 'none';
  if (show) $txt.textContent = v;
}

// 외부에서 호출: 데이터 도착 후 사이드바 업데이트
function updateSidebar(baseList){
  // baseList: 서버에서 받은 원본 (필터 적용 전)
  buildFiltersFromData(baseList);

  // 필터 적용
  let list = applyFilter(baseList);

  // 정렬(가까운 순 활성 시)
  list = maybeSortByDistance(list);

  // 헤더 숫자/버튼 상태
  updateListHeader(list, baseList);

  // 검색 배지 상태 동기화
  syncSearchBadge();

  // 목록 영역은 map.js의 renderList(list)가 실제 항목을 만든다.
  // 여기선 list만 반환하여 map.js가 사용하도록 할 수도 있지만,
  // 간섭을 최소화하려면 hook으로만 필터/정렬을 적용한다.
  return list;
}

// ----- 이벤트 바인딩 -----
document.addEventListener('DOMContentLoaded', () => {
  // 가까운 순 토글
  const btn = document.getElementById('sortByDistance');
  if (btn){
    btn.addEventListener('click', () => {
      const active = btn.dataset.active === 'true';
      btn.dataset.active = String(!active);
      btn.textContent = !active ? '가까운 순(활성)' : '가까운 순';
      // 재렌더 요청
      requestRerender();
    });
  }

  // 검색 해제
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn){
    clearBtn.addEventListener('click', async () => {
      const $q = document.getElementById('search');
      if ($q){
        $q.value = '';
        window.searchMode = false;
        if (typeof window.fetchByViewport === 'function') await window.fetchByViewport();
      }
    });
  }
});

// 외부에서: 내 위치가 정해졌을 때 불러주세요.
function setMyLocationForSidebar(lat, lng){
  SidebarState.myLocation = { lat, lng };
  const btn = document.getElementById('sortByDistance');
  if (btn){ btn.disabled = false; btn.setAttribute('aria-disabled','false'); }
}

// map.js 쪽에서 쓰는 hook들을 노출
window.__sidebar = {
  updateSidebar,
  applyFilter,
  setMyLocationForSidebar,
};
window.__sidebar.__state = SidebarState;

// map.js에서 쉽게 쓰라고 별도 헬퍼도 노출
function requestRerender(){
  if (typeof window.__requestSidebarRerender === 'function'){
    window.__requestSidebarRerender();
  } else if (typeof window.fetchByViewport === 'function' && !window.searchMode){
    // 검색 모드가 아니면 뷰포트 데이터로 재조회
    window.fetchByViewport();
  } else if (typeof window.__forceSearchRefresh === 'function' && window.searchMode){
    // 검색 모드면 검색 재실행
    window.__forceSearchRefresh();
  }
}