// ===== Globals =====
let map;
let currentType = 'all';
const gMarkers = [];
const gInfoWindows = [];
let allData = [];
let clusterer = null;
let searchMode = false; // ← 검색 결과 화면인지 여부

// 클릭으로 연 InfoWindow 추적
let lastOpenedByClick = null;

// 캐시 키(라운딩된 bbox)
let lastBboxKey = '';

// (브리지: segment_toggle.js와 상태 동기화)
Object.defineProperty(window, 'currentType', {
  get(){ return currentType; },
  set(v){ currentType = v; }
});
Object.defineProperty(window, 'lastBboxKey', {
  get(){ return lastBboxKey; },
  set(v){ lastBboxKey = v; }
});

// Advanced Marker 사용 가능 여부(벡터 맵 + 라이브러리 로드되면 true로 설정)
window.allowAdvanced = false;

const GMap = {
  Map: null,
  Marker: null,
  InfoWindow: null,
  AdvancedMarkerElement: null,
  PinElement: null,
};

// ===== Utils =====
// 종목 코드 문자열을 보기 좋은 이름으로 치환
function mapDesignationLabel(raw) {
  if (!raw) return '';
  const map = (window.designationMap || {});
  // "13" / "11,12" / "11|12" / " 13 " 등 다양한 구분자/공백 허용
  const tokens = String(raw).split(/[|,/]/).map(s => s.trim()).filter(Boolean);
  if (tokens.length === 0) return '';

  const names = tokens.map(tok => {
    const num = Number(tok);
    // 숫자면 매핑 시도, 아니면 원문 유지
    if (Number.isFinite(num) && map[num]) return map[num];
    return tok;
  });

  // 중복 제거 + 보기 좋게 합침
  return [...new Set(names)].join(' · ');
}

// (NEW) InfoWindow/리스트에서 표기할 메타(종목명이 우선, 없으면 era/region 등) 계산
function getDisplayMeta(item) {
  // item.category에는 서버에서 designation 또는 era가 들어올 수 있음
  const fromCategory = mapDesignationLabel(item.category);
  if (fromCategory) return fromCategory;

  // 백업 표기(원한다면 여기 우선순위 조정 가능)
  // era나 region 등 추가 노출 원하면 이어붙여도 됨
  return (item.era || item.region || '').trim();
}

// 안전한 텍스트 전용 DOM 빌더들
function buildIwContent(item){
  const wrap = document.createElement('div'); wrap.className = 'iw';

  const title = document.createElement('div');
  title.className = 'iw-title';
  title.textContent = item.name ?? '';
  wrap.appendChild(title);

  const addr = document.createElement('div');
  addr.className = 'iw-addr';
  addr.textContent = (item.address ?? item.region ?? '') || '';
  wrap.appendChild(addr);

  const metaLabel = getDisplayMeta(item);
  if (metaLabel) {
    const meta = document.createElement('div');
    meta.className = 'iw-meta';
    meta.textContent = metaLabel; // ← 매핑 적용된 라벨
    wrap.appendChild(meta);
  }

  // 상세보기 버튼 추가
    if (item.type === 'heritage' && item.id) {
      const btn = document.createElement('button');
      btn.className = 'iw-detail-btn'; // CSS에서 밑줄만 주면 깔끔
      btn.textContent = '상세보기';
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.padding = '0';
      btn.style.color = '#007BFF';
      btn.style.textDecoration = 'underline';
      btn.style.cursor = 'pointer';
      btn.onclick = () => {
        window.location.href = `/heritage/${item.id}`;
      };
      wrap.appendChild(btn);
    }

  return wrap;
}

function buildListCard(item){
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'card';

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = item.name ?? '';

  const addr = document.createElement('div');
  addr.className = 'addr';
  addr.textContent = `주소: ${(item.address ?? item.region ?? '')}`;

  const desc = document.createElement('div');
  desc.className = 'desc';
  desc.textContent = getDisplayMeta(item); // ← 리스트에도 매핑 적용
  el.append(name, addr, desc);
  return el;
}

function closeAllInfo(){ gInfoWindows.forEach(iw => iw.close()); }

function clearMarkers(){
  // 1) 클러스터러 정리
  if (clusterer?.clearMarkers) clusterer.clearMarkers();
  clusterer = null;

  // 2) 마커/인포윈도우 정리
  gMarkers.forEach(m => { if (m?.setMap) m.setMap(null); else if (m) m.map = null; });
  gMarkers.length = 0;
  gInfoWindows.forEach(iw => iw.close());
  gInfoWindows.length = 0;
}

function isFiniteLatLng(lat,lng){ return Number.isFinite(lat) && Number.isFinite(lng); }

function toLatLngLiteral(item){
  const lat = Number(item.latitude ?? item.lat);
  const lng = Number(item.longitude ?? item.lng);
  return isFiniteLatLng(lat,lng) ? { lat, lng } : null;
}

function getMarkerPosition(mk){ return mk?.position ?? mk?.getPosition?.(); }

function getTypeColor(type){
  // 박물관/미술관: 파랑, 문화재: 빨강
  return (type === 'museum') ? '#2563eb' : '#dc2626';
}

function makeSvgIcon(color='#dc2626'){
  // AdvancedMarker를 못 쓸 때를 위한 색상 아이콘(SVG path)
  return {
    path: "M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 1,
  };
}

// 검색
async function fetchSearchResults(q, type = currentType, limit = 30) {
  const url = new URL('/map/search', window.location.origin);
  url.searchParams.set('q', q);
  url.searchParams.set('type', type || 'all');
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 200))); // 1~200 클램프

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('검색 요청 실패: ' + res.status);
  return res.json(); // MapMarkerDto[]
}

// ------- Legacy endpoint loader (현재는 안 씀, 보관) -------
async function loadMarkers(params = {}){
  const endpoint = document.querySelector('.map-root').dataset.endpoint || '/map';
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('type', params.type || currentType);
  if (params.designation) url.searchParams.set('designation', params.designation);
  if (params.region)      url.searchParams.set('region', params.region);
  if (params.era)         url.searchParams.set('era', params.era);

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok){ console.error('마커 로드 실패', res.status); return; }

  allData = await res.json();
  renderMarkers(allData);
  renderList(allData);
}

// ------- Markers / List -------
function renderMarkers(list){
  // === [NEW] 좌표 기준 그룹핑 유틸 ===
  function groupByPosition(items, precision = 6){
    const map = new Map();
    items.forEach(item => {
      const pos = toLatLngLiteral(item);
      if (!pos) return;
      const lat = Number(pos.lat).toFixed(precision);
      const lng = Number(pos.lng).toFixed(precision);
      const key = `${lat},${lng}`;
      if (!map.has(key)){
        map.set(key, { pos:{ lat:Number(lat), lng:Number(lng) }, items:[] });
      }
      map.get(key).items.push(item);
    });
    return Array.from(map.values()); // [{pos, items:[...]}, ...]
  }

  // === [NEW] 그룹 InfoWindow 콘텐츠 ===
  function buildIwGroupContent(group){
    const wrap = document.createElement('div');
    wrap.className = 'iw iw-group';

    // 주소 (굵게, 아래 선)
    const addr = document.createElement('div');
    addr.className = 'iw-title';
    addr.textContent = group.items[0]?.address ?? group.items[0]?.region ?? '';
    wrap.appendChild(addr);

    // "이 위치의 항목 (n개)" (작은 회색, 아래 선)
    const title = document.createElement('div');
    title.className = 'iw-addr';
    title.textContent = `이 위치의 항목 (${group.items.length}개)`;
    wrap.appendChild(title);

    // 리스트
    const listEl = document.createElement('div');
    listEl.className = 'iw-group-list';

    group.items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'iw-group-row';

      const name = document.createElement('div');
      name.className = 'iw-group-name';
      name.textContent = it.name ?? '(이름 없음)';

      const meta = document.createElement('div');
      meta.className = 'iw-group-meta';
      meta.textContent = getDisplayMeta(it);

      row.appendChild(name);
      row.appendChild(meta);

      // === 상세보기 버튼 ===
      if (it.type === 'heritage' && it.id) {
        const btn = document.createElement('a');
        btn.textContent = '상세보기';
        btn.href = `/heritage/${it.id}`;
        btn.className = 'iw-detail-btn';
        btn.style.textDecoration = 'underline';
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.color = '#0066cc';

        row.appendChild(btn);
      }

      listEl.appendChild(row);
    });

    wrap.appendChild(listEl);
    return wrap;
  }

  clearMarkers();

  const AdvancedCtor = window.allowAdvanced
    ? (GMap.AdvancedMarkerElement || (google.maps.marker && google.maps.marker.AdvancedMarkerElement))
    : null;
  const MarkerCtor = GMap.Marker || google.maps.Marker;
  const InfoWindowCtor = GMap.InfoWindow || google.maps.InfoWindow;

  // (1) 튜닝: 포인트 50개 이하이면 클러스터러 비활성화
  //  ※ 그룹핑 후 개수 기준으로 판단해야 하므로 list.length 대신 groups.length 사용
  const groups = groupByPosition(list, 6); // ← 좌표 소수 6자리로 묶기
  const useClusterer = Boolean(window.markerClusterer?.MarkerClusterer) && groups.length > 50;

  groups.forEach(group => {
    const pos = group.pos;

    // 그룹 크기에 따라 InfoWindow 콘텐츠 결정
    const info = new InfoWindowCtor({
      content: group.items.length === 1
        ? buildIwContent(group.items[0])
        : buildIwGroupContent(group)
    });

    // 그룹 대표 색: 그룹 내 첫 항목 기준(필요시 majority 로직 도입 가능)
    const color = getTypeColor(group.items[0]?.type);
    let mk;

    if (AdvancedCtor){
      let content;
      if (GMap.PinElement){
        const pin = new GMap.PinElement({
          background: color,
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: 0.7,
        });
        content = pin.element;
      }

      mk = new AdvancedCtor({
        position: pos,
        ...(useClusterer ? {} : { map }),
        title: (group.items[0]?.name || '') + (group.items.length > 1 ? ` 외 ${group.items.length-1}` : ''),
        ...(content ? { content } : {}),
      });

      mk.addListener?.('gmp-mouseover', () => {
        if (lastOpenedByClick === info) return;
        // 그룹일 때는 hover로도 리스트를 보여주되, 클릭하면 고정
        closeAllInfo();
        info.open({ anchor: mk, map });
      });
      mk.addListener?.('gmp-mouseout', () => {
        if (lastOpenedByClick === info) return;
        info.close();
      });
      mk.addListener?.('click', () => {
        closeAllInfo();
        info.open({ anchor: mk, map });
        lastOpenedByClick = info;
      });

    } else {
      mk = new MarkerCtor({
        position: pos,
        ...(useClusterer ? {} : { map }),
        title: (group.items[0]?.name || '') + (group.items.length > 1 ? ` 외 ${group.items.length-1}` : ''),
        icon: makeSvgIcon(color),
        optimized: true,
      });

      mk.addListener('mouseover', () => {
        if (lastOpenedByClick === info) return;
        closeAllInfo();
        info.open({ anchor: mk, map });
      });
      mk.addListener('mouseout', () => {
        if (lastOpenedByClick === info) return;
        info.close();
      });
      mk.addListener('click', () => {
        closeAllInfo();
        info.open({ anchor: mk, map });
        lastOpenedByClick = info;
      });
    }

    mk._info = info;
    mk._group = group; // ← 참고용으로 그룹 저장

    gMarkers.push(mk);
    gInfoWindows.push(info);
  });

  // (1) 튜닝 적용: 조건부로만 클러스터링 (그룹된 마커들 기준)
  if (useClusterer) {
    const renderer = {
      render({ count, position }) {
        const isRed  = count > 10;
        const size   = count <= 10 ? 22 : 26;
        const bg     = isRed ? '#dc2626' : '#2563eb';
        const border = isRed ? '#b91c1c' : '#1d4ed8';

        if (window.allowAdvanced && google.maps.marker?.AdvancedMarkerElement) {
          const el = document.createElement('div');
          el.textContent = String(count);
          el.style.cssText = `
            display:grid;place-items:center;
            width:${size}px;height:${size}px;border-radius:9999px;
            background:radial-gradient(closest-side, ${hex2rgba(bg,.15)}, ${hex2rgba(bg,.55)});
            color:#fff;border:2px solid ${border};
            font:700 11px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;
            box-shadow:0 1px 2px rgba(0,0,0,.15);
          `;
          return new google.maps.marker.AdvancedMarkerElement({
            position, content: el, zIndex: Number(count)
          });
        }

        const scale = size / 2;
        return new google.maps.Marker({
          position,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale,
            fillColor: bg,
            fillOpacity: 0.9,
            strokeColor: border,
            strokeWeight: 2,
          },
          label: {
            text: String(count),
            color: '#fff',
            fontSize: '11px',
            fontWeight: '700',
          },
          zIndex: Number(count)
        });
      }
    };

    clusterer = new markerClusterer.MarkerClusterer({
      map,
      markers: gMarkers,
      renderer,
      onClusterClick: (ev) => {
        skipNextFetchOnce = true;

        const ms = ev?.markers || [];
        const bounds = new google.maps.LatLngBounds();
        ms.forEach(mk => {
          const p = getMarkerPosition(mk);
          if (p) bounds.extend(p);
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 80);
          const once = map.addListener('idle', () => {
            if (map.getZoom() > 18) map.setZoom(18);
            google.maps.event.removeListener(once);
          });
        } else {
          const pos = ev?.cluster?.position || ev?.marker?.getPosition?.();
          if (pos) map.panTo(pos);
          map.setZoom(map.getZoom() + 1);
        }
      }
    });
  }

  // 작은 유틸: HEX → rgba
  function hex2rgba(hex, alpha=1) {
    const v = hex.replace('#','');
    const n = v.length === 3
      ? v.split('').map(c => parseInt(c+c,16))
      : [v.slice(0,2),v.slice(2,4),v.slice(4,6)].map(h=>parseInt(h,16));
    return `rgba(${n[0]},${n[1]},${n[2]},${alpha})`;
  }
}

function renderList(list){
  const $list = document.getElementById('list'); if (!$list) return;
  $list.innerHTML = '';

  // 좌표 기반 그룹핑(마커와 동일 기준: 소수 6자리)
  function groupByPosition(items, precision = 6){
    const map = new Map();
    (items || []).forEach(item => {
      const p = toLatLngLiteral(item);
      if (!p) return;
      const lat = Number(p.lat).toFixed(precision);
      const lng = Number(p.lng).toFixed(precision);
      const key = `${lat},${lng}`;
      if (!map.has(key)){
        map.set(key, { pos:{ lat:Number(lat), lng:Number(lng) }, items:[] });
      }
      map.get(key).items.push(item);
    });
    return Array.from(map.values());
  }

  // 그룹 카드(여러 건) — 주소 + 개수만
  function buildGroupCard(group){
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'card';

    const name = document.createElement('div');
    name.className = 'name';
    // 첫 항목의 address/region 사용
    name.textContent = group.items[0]?.address || group.items[0]?.region || '(주소 없음)';

    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = `이 위치의 항목 ${group.items.length}개`;

    el.append(name, desc);
    return el;
  }

  const groups = groupByPosition(list, 6);

  groups.forEach(group => {
    const isSingle = group.items.length === 1;
    const el = isSingle ? buildListCard(group.items[0]) : buildGroupCard(group);

    // 클릭 시: 해당 좌표의(그룹 대표) 마커 찾고 InfoWindow 열기
    el.addEventListener('click', () => {
      const p = group.pos; if (!p) return;

      const mk = gMarkers.find(m => {
        const mp = getMarkerPosition(m);
        if (!mp) return false;
        const ml = typeof mp.lat === 'function' ? mp.lat() : mp.lat;
        const mlg = typeof mp.lng === 'function' ? mp.lng() : mp.lng;
        return Math.abs(ml - p.lat) < 1e-6 && Math.abs(mlg - p.lng) < 1e-6;
      });

      map.panTo(p);
      map.setZoom(Math.max(map.getZoom() || 0, 14));

      if (mk?._info){
        closeAllInfo();
        mk._info.open({ anchor: mk, map });
        lastOpenedByClick = mk._info;
      }
    });

    $list.appendChild(el);
  });
}

// 검색 결과에 맞춰 지도 뷰 이동(결과가 1개면 그 좌표로, 여러개면 bounds로)
function fitMapToResults(list){
  if (!list || list.length === 0) return;

  const pos0 = toLatLngLiteral(list[0]);
  if (list.length === 1 && pos0) {
    map.panTo(pos0);
    map.setZoom(Math.max(14, map.getZoom() || 0));
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  let added = 0;
  list.forEach(it => {
    const p = toLatLngLiteral(it);
    if (p) { bounds.extend(p); added++; }
  });
  if (added > 0) {
    map.fitBounds(bounds, 80);
    const once = map.addListener('idle', () => {
      if (map.getZoom() > 16) map.setZoom(16);
      google.maps.event.removeListener(once);
    });
  }
}

// ------- Search -------
function wireSearch(){
  const $q = document.getElementById('search');
  if (!$q) return;

  const $icon = document.querySelector('.toolbar-search .search-icon');
  let inflight = false; // 중복 실행 방지

  // 공통 검색 실행 (옵션으로 알림/자동이동 제어)
  const executeSearch = async ({ notify = false, autoFit = true } = {}) => {
    const query = $q.value.trim();

    // 비어있으면: 검색모드 해제 + 뷰포트 복귀(제출일 때만)
    if (!query) {
      if (notify) {
        searchMode = false;
        await fetchByViewport();
      }
      return;
    }

    if (inflight) return;
    inflight = true;
    $q.setAttribute('aria-busy', 'true');

    try {
      const list = await fetchSearchResults(query, currentType, 50);

      // 사용자가 그 사이 다른 입력을 했으면 이 결과는 버림 (레이스 가드)
      if ($q.value.trim() !== query) return;

      if (!list || list.length === 0) {
        if (notify) {
          alert('검색 결과가 없습니다.');
          searchMode = false;
          await fetchByViewport();
        }
        // 조용한 모드(silent)면 아무것도 바꾸지 않고 종료
        return;
      }

      // 검색 결과가 있을 때만 검색모드 전환 및 렌더
      searchMode = true;
      allData = list;
      const filtered = (window.__sidebar?.updateSidebar)
        ? window.__sidebar.updateSidebar(list)
        : list;
      renderMarkers(filtered);
      renderList(filtered);

      skipNextFetchOnce = true;

      if (autoFit) fitMapToResults(list);
    } catch (e) {
      console.error(e);
      if (notify) alert('검색 중 오류가 발생했습니다.');
    } finally {
      $q.removeAttribute('aria-busy');
      inflight = false;
    }
  };

  // 디바운스 + 즉시 실행 래퍼
  function smartDebounce(fn, delay){
    let t = null;
    const debounced = (opts) => {
      clearTimeout(t);
      t = setTimeout(() => fn(opts), delay);
    };
    debounced.now = (opts) => {
      clearTimeout(t);
      fn(opts);
    };
    return debounced;
  }

  const run = smartDebounce(executeSearch, 300);

  // 타이핑 중엔 조용히(silent) 검색: 알림/뷰 복귀/오토핏 없음
  $q.addEventListener('input', () => run({ notify: false, autoFit: false }));

  // 엔터키 → 즉시 실행 + 안내/오토핏
  $q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      run.now({ notify: true, autoFit: true });
    }
  });

  // 돋보기 클릭 → 즉시 실행 + 안내/오토핏
  if ($icon) {
    $icon.addEventListener('click', () => run.now({ notify: true, autoFit: true }));
  }
}

// 간단 디바운스
function debounce(fn, delay){
  let t;
  function wrapped(...args){
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  }
  wrapped.flush = () => { clearTimeout(t); fn(); };
  return wrapped;
}

// ------- Google loader & init -------
function loadGoogleMaps(apiKey){
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    const cb = '__gm_cb_' + Math.random().toString(36).slice(2);
    window[cb] = () => resolve();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async&libraries=marker&callback=${cb}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error('Google Maps JS 로드 실패'));
    document.head.appendChild(s);
  });
}

async function initMap(){
  if (google.maps.importLibrary){
    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const markerLib = await google.maps.importLibrary('marker'); // AdvancedMarkerElement, PinElement
    GMap.Map = Map;
    GMap.InfoWindow = InfoWindow;

    if (markerLib.AdvancedMarkerElement) GMap.AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
    if (markerLib.PinElement)            GMap.PinElement            = markerLib.PinElement;
    if (markerLib.Marker)                GMap.Marker                = markerLib.Marker;

    const root = document.querySelector('.map-root');
    const mapId = root?.dataset.mapId || null;

    const mapOptions = {
      center:{ lat:37.5665, lng:126.9780 }, zoom:12,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:true
    };
    if (mapId) mapOptions.mapId = mapId; // 벡터 지도

    map = new GMap.Map(document.getElementById('map'), mapOptions);

    // Advanced Marker 사용 가능 플래그(벡터 맵 + 클래스 존재)
    window.allowAdvanced = Boolean(mapId) && !!GMap.AdvancedMarkerElement;
  } else {
    map = new google.maps.Map(document.getElementById('map'), {
      center:{ lat:37.5665, lng:126.9780 }, zoom:12,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:true
    });
  }

  wireLocateButton();
  wireSearch();
  wireTypeSegment();

  // 초기 UI 동기화
  document.querySelectorAll('#typeSegment .seg-btn')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === currentType)));

  // 뷰포트 로딩으로 전환
  wireViewportLoading(); // idle에서 첫 로딩까지 자동

  // initMap() 안, wireViewportLoading() 호출 직전에 한 줄 추가
  map.addListener('click', () => {
    lastOpenedByClick = null;
    closeAllInfo();
  });

  window.__forceSearchRefresh = async () => {
    const $q = document.getElementById('search'); if (!$q) return;
    const query = $q.value.trim();
    if (!query) { searchMode = false; await fetchByViewport(); return; }
    try {
      $q.setAttribute('aria-busy', 'true');
      const list = await fetchSearchResults(query, currentType, 50);
      allData = list;
      const filtered = (window.__sidebar?.updateSidebar)
        ? window.__sidebar.updateSidebar(list)
        : list;
      renderMarkers(filtered);
      renderList(filtered);

      skipNextFetchOnce = true;

      if (!list || list.length === 0) {
        alert('검색 결과가 없습니다.');
        searchMode = false;
        await fetchByViewport();
        return;
      }

      fitMapToResults(list);
    } finally {
      $q.removeAttribute('aria-busy');
    }
  };
}

// ------- Boot -------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const btn = document.getElementById('locateBtn');
    if (btn) btn.disabled = true; // 초기 비활성화

    const root = document.querySelector('.map-root');
    const apiKey = root?.dataset.mapsKey;
    if (!apiKey) return console.error('maps api key 누락');
    await loadGoogleMaps(apiKey);
    await initMap();

    if (btn) btn.disabled = false; // 지도 준비 후 활성화
  } catch (e) {
    console.error(e);
  }
});

// ------- Viewport loader -------
let aborter = null;
let skipNextFetchOnce = false; // 클러스터 클릭 직후 1회 재조회 스킵

function getBboxFromMap() {
  if (!map || !map.getBounds) return null;
  const b = map.getBounds(); if (!b) return null;
  const ne = b.getNorthEast(), sw = b.getSouthWest();
  return { south: sw.lat(), west: sw.lng(), north: ne.lat(), east: ne.lng() };
}

async function fetchByViewport() {
  const bbox = getBboxFromMap(); if (!bbox) return;

  // 캐시 키는 적당히 라운딩해서 동일 요청 방지
  const key = [
    bbox.south.toFixed(5),
    bbox.west.toFixed(5),
    bbox.north.toFixed(5),
    bbox.east.toFixed(5)
  ].join(',');
  if (key === lastBboxKey) return;
  lastBboxKey = key;

  // 실제 요청은 5% 패딩을 준 넉넉한 bbox로 (경계 유실 방지)
  const padLat = (bbox.north - bbox.south) * 0.05;
  const padLng = (bbox.east  - bbox.west)  * 0.05;
  const reqBox = {
    south: bbox.south - padLat,
    west:  bbox.west  - padLng,
    north: bbox.north + padLat,
    east:  bbox.east  + padLng
  };
  const reqStr = [
    reqBox.south.toFixed(7),
    reqBox.west.toFixed(7),
    reqBox.north.toFixed(7),
    reqBox.east.toFixed(7)
  ].join(',');

  if (aborter) aborter.abort();
  aborter = new AbortController();

  const url = new URL('/map/points', window.location.origin);
  url.searchParams.set('bbox', reqStr);
  url.searchParams.set('type', currentType); // 'all' | 'heritage' | 'museum'
  url.searchParams.set('limit', 800);

  // 사이드바 필터(있을 때만)
  const ss = window.__sidebar;
  if (ss) {
    const cats = [...(ss.__state?.selectedMuseumCats || new Set())];
    const desi = [...(ss.__state?.selectedDesignations || new Set())];
    cats.forEach(c => url.searchParams.append('museumCats', String(c).trim()));
    desi.forEach(d => url.searchParams.append('designations', d)); // 종목 코드
  }

  try {
    const res = await fetch(url, {
      signal: aborter.signal,
      headers: { Accept: 'application/json' }
    });

    if (!res.ok) {
      console.warn('지점 로드 실패 (HTTP ' + res.status + ')');
      return;
    }

    const list = await res.json();
    allData = list;
    const filtered = (window.__sidebar?.updateSidebar)
      ? window.__sidebar.updateSidebar(list)
      : list;
    renderMarkers(filtered);
    renderList(filtered);

  } catch (e) {
    if (e.name !== 'AbortError') console.error('지점 로드 에러:', e);
  }
}

window.fetchByViewport = fetchByViewport;

function wireViewportLoading(){
  let t=null;
  map.addListener('idle', () => {
    if (searchMode) return;            // ← 검색 모드면 뷰포트 재조회 스킵
    if (skipNextFetchOnce) {           // (기존)
      skipNextFetchOnce = false;
      return;
    }
    clearTimeout(t);
    t = setTimeout(fetchByViewport, 250);
  });
}