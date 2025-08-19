// 내부 상태
const SidebarState = {
  selectedMuseumCats: new Set(),   // 문자열(카테고리)
  selectedDesignations: new Set(), // "11","12",...
  myLocation: null,                // {lat,lng} 있을 때만 거리 정렬 활성
};

// 어떤 문자열이 와도 DOM id로 안전한 짧은 해시
function safeId(prefix, text) {
  let h = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return `${prefix}_${(h >>> 0).toString(36)}`;
}

// 거리 계산(Haversine)
function distMeters(a, b){
  const toRad = d => d * Math.PI / 180, R = 6371000;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat/2), s2 = Math.sin(dLng/2);
  const A = s1*s1 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*s2*s2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(A)));
}

/* ==== 문화재 종목 토큰 정규화: "11"도, "국보"도 코드 배열로 환원 ==== */
function normalizeDesigToken(token){
  const t = String(token || '').trim();
  if (!t) return [];
  // 숫자라면 그대로 코드 취급
  if (/^\d+$/.test(t)) return [t];
  // 한글 라벨이면 designationMap에서 역매핑
  const dm = window.designationMap || {}; // 예: { "11":"국보", "12":"보물", ... }
  const codes = [];
  for (const code of Object.keys(dm)) {
    if (String(dm[code]).trim() === t) codes.push(String(code));
  }
  return codes;
}

/* ===== 가시성: 타입(all/museum/heritage)에 따라 필터 보이기/숨기기 ===== */
function syncFilterVisibility(){
  const t = (window.currentType || 'all').toLowerCase();
  const m = document.getElementById('museumFilter');
  const h = document.getElementById('heritageFilter');
  if (!m || !h) return;

  if (t === 'all') { m.style.display = ''; h.style.display = ''; }
  else if (t === 'museum') { m.style.display = ''; h.style.display = 'none'; }
  else if (t === 'heritage') { m.style.display = 'none'; h.style.display = ''; }
  else { m.style.display = ''; h.style.display = ''; } // 예외는 all처럼
}

/* ===== 필터 변경 시 서버에서 새로 가져오도록 트리거 ===== */
function triggerServerRefetch(){
  try { window.lastBboxKey = ''; } catch(e) {}
  if (!window.searchMode && typeof window.fetchByViewport === 'function'){
    window.fetchByViewport();
  } else if (window.searchMode && typeof window.__forceSearchRefresh === 'function'){
    window.__forceSearchRefresh();
  } else if (typeof window.__requestSidebarRerender === 'function'){
    window.__requestSidebarRerender();
  }
}

/* ===== 필터 UI 빌드 ===== */
function buildFiltersFromData(list){
  const museumCount = new Map(); // cat -> n
  const desigCount  = new Map(); // code -> n

  (list || []).forEach(it => {
    if (it.type === 'museum' && it.category) {
      const cat = String(it.category).trim();
      museumCount.set(cat, (museumCount.get(cat) || 0) + 1);
    }
    if (it.type === 'heritage' && it.category) {
      // "11|12" 또는 "국보, 보물" 같은 혼합을 모두 코드로 환원해 집계
      String(it.category)
        .split(/[|,/]/)
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(tok => {
          const codes = normalizeDesigToken(tok);
          const incTargets = codes.length ? codes : []; // 미매칭 라벨은 스킵
          incTargets.forEach(code => {
            desigCount.set(code, (desigCount.get(code) || 0) + 1);
          });
        });
    }
  });

  // 박물관 카테고리
  const $mWrap = document.getElementById('museumCatList');
  if ($mWrap){
    $mWrap.innerHTML = '';
    [...museumCount.entries()].sort((a,b)=>a[0].localeCompare(b[0], 'ko'))
      .forEach(([cat, n]) => {
        const id = safeId('mcat', cat);
        const row = document.createElement('label');
        row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.margin='4px 0';
        row.innerHTML = `
          <input type="checkbox" id="${id}" data-cat="${cat}">
          <span>${cat}</span>
          <span style="margin-left:auto;color:#6b7280">${n}</span>
        `;
        const box = row.querySelector('input');
        box.checked = SidebarState.selectedMuseumCats.has(cat);
        box.addEventListener('change', () => {
          box.checked ? SidebarState.selectedMuseumCats.add(cat) : SidebarState.selectedMuseumCats.delete(cat);
          triggerServerRefetch(); // ← 서버 재조회
        });
        $mWrap.appendChild(row);
      });
  }

  // 문화재 종목
  const $hWrap = document.getElementById('heritageDesignationList');
  if ($hWrap){
    $hWrap.innerHTML = '';
    const order = Object.keys(window.designationMap || {}).map(String); // 코드 순서
    order.forEach(code => {
      const n = desigCount.get(code) || 0;
      if (n === 0) return;
      const id = 'hdes_' + code;
      const label = window.designationMap?.[code] || code;
      const row = document.createElement('label');
      row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.margin='4px 0';
      row.innerHTML = `
        <input type="checkbox" id="${id}" data-code="${code}">
        <span>${label}</span>
        <span style="margin-left:auto;color:#6b7280">${n}</span>
      `;
      const box = row.querySelector('input');
      box.checked = SidebarState.selectedDesignations.has(code);
      box.addEventListener('change', () => {
        box.checked ? SidebarState.selectedDesignations.add(code) : SidebarState.selectedDesignations.delete(code);
        triggerServerRefetch(); // ← 서버 재조회
      });
      $hWrap.appendChild(row);
    });
  }
}

/* ===== 필터 적용 ===== */
function applyFilter(list){
  let out = list || [];

  const hasMuseumFilter   = SidebarState.selectedMuseumCats.size > 0;
  const hasHeritageFilter = SidebarState.selectedDesignations.size > 0;
  const typeNow = (window.currentType || 'all').toLowerCase();

  const hasSelectedDesig = (catStr) => {
    if (!catStr) return false;
    const tokens = String(catStr).split(/[|,/]/).map(s=>s.trim()).filter(Boolean);
    for (const tok of tokens){
      const codes = normalizeDesigToken(tok); // "11"도, "국보"도 코드로 비교
      for (const c of codes){
        if (SidebarState.selectedDesignations.has(c)) return true;
      }
    }
    return false;
  };

  // 타입별/상태별로 필터 적용
  if (typeNow === 'all') {
    if (hasMuseumFilter || hasHeritageFilter){
      out = out.filter(it => {
        if (it.type === 'museum'){
          if (!hasMuseumFilter) return true; // 문화재 필터만 켜진 경우: 박물관은 서버에서 종목 반영
          const cat = (it.category ?? '').toString().trim();
          return SidebarState.selectedMuseumCats.has(cat);
        }
        if (it.type === 'heritage'){
          if (hasHeritageFilter) return hasSelectedDesig(it.category);
          // 박물관 카테고리만 켜진 경우: 문화재는 비노출
          return false;
        }
        return true;
      });
    }
  } else if (typeNow === 'museum') {
    if (hasMuseumFilter){
      out = out.filter(it => it.type !== 'museum'
        || SidebarState.selectedMuseumCats.has((it.category ?? '').toString().trim()));
    }
  } else if (typeNow === 'heritage') {
    if (hasHeritageFilter){
      out = out.filter(it => it.type !== 'heritage' || hasSelectedDesig(it.category));
    }
  }

  return out;
}

/* ===== 리스트/상태 요약 ===== */
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

/* ===== 정렬(가까운 순) ===== */
function maybeSortByDistance(list){
  const btn = document.getElementById('sortByDistance');
  if (!btn || btn.dataset.active !== 'true') return list;
  const me = SidebarState.myLocation; if (!me) return list;

  const hasServerDistance = list.some(d => typeof d.distanceMeters === 'number' && d.distanceMeters > 0);
  if (hasServerDistance) return [...list].sort((a,b)=>(a.distanceMeters||0)-(b.distanceMeters||0));

  return [...list].sort((a,b)=>{
    const pa = {lat:a.lat, lng:a.lng}, pb = {lat:b.lat, lng:b.lng};
    return distMeters(me, pa) - distMeters(me, pb);
  });
}

/* ===== 검색 배지 ===== */
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

/* ===== 외부에서 호출: 데이터 도착 후 사이드바 업데이트 ===== */
function updateSidebar(baseList){
  buildFiltersFromData(baseList);

  // 타입에 따른 보이기/숨기기
  syncFilterVisibility();

  let list = applyFilter(baseList);
  list = maybeSortByDistance(list);
  updateListHeader(list, baseList);
  syncSearchBadge();

  return list; // map.js에서 이 결과로 renderList 호출
}

/* ===== 초기화 ===== */
function resetAll(){
  // 체크 해제
  document.querySelectorAll('#museumCatList input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#heritageDesignationList input[type="checkbox"]').forEach(cb => cb.checked = false);

  // 상태 초기화
  SidebarState.selectedMuseumCats.clear();
  SidebarState.selectedDesignations.clear();

  // 타입을 '전체'로
  if (typeof window.setType === 'function') {
    window.setType('all'); // 내부에서 재조회 해줌
  } else {
    // 혹시를 대비
    window.currentType = 'all';
    triggerServerRefetch();
  }

  // 보이기/숨기기 동기화
  syncFilterVisibility();
}

/* ===== 이벤트 바인딩 ===== */
document.addEventListener('DOMContentLoaded', () => {
  // 가까운 순 토글
  const btn = document.getElementById('sortByDistance');
  if (btn){
    btn.addEventListener('click', () => {
      const active = btn.dataset.active === 'true';
      btn.dataset.active = String(!active);
      btn.textContent = !active ? '가까운 순(활성)' : '가까운 순';
      // 정렬 토글은 클라 렌더만
      if (typeof window.__requestSidebarRerender === 'function') {
        window.__requestSidebarRerender();
      }
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

  // 초기화 버튼
  const resetBtn = document.getElementById('resetAllBtn');
  if (resetBtn){
    resetBtn.addEventListener('click', resetAll);
  }

  // 최초 가시성 동기화
  syncFilterVisibility();
});

/* ===== 외부에서: 내 위치가 정해졌을 때 ===== */
function setMyLocationForSidebar(lat, lng){
  SidebarState.myLocation = { lat, lng };
  const btn = document.getElementById('sortByDistance');
  if (btn){ btn.disabled = false; btn.setAttribute('aria-disabled','false'); }
}

/* 노출 */
window.__sidebar = { updateSidebar, applyFilter, setMyLocationForSidebar };
window.__sidebar.__state = SidebarState;

/* 재렌더 헬퍼 (기본 동작은 유지) */
function requestRerender(){
  if (typeof window.__requestSidebarRerender === 'function'){
    window.__requestSidebarRerender();
  } else if (typeof window.fetchByViewport === 'function' && !window.searchMode){
    window.fetchByViewport();
  } else if (typeof window.__forceSearchRefresh === 'function' && window.searchMode){
    window.__forceSearchRefresh();
  }
}