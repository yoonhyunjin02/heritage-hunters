// ===== Globals =====
let map;
let currentType = 'all';
const gMarkers = [];
const gInfoWindows = [];
let allData = [];
let clusterer = null;

// 클릭으로 연 InfoWindow를 추적 (마우스 아웃으로 닫히지 않게)
let lastOpenedByClick = null;

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
  clearMarkers();

  const AdvancedCtor = window.allowAdvanced
    ? (GMap.AdvancedMarkerElement || (google.maps.marker && google.maps.marker.AdvancedMarkerElement))
    : null;
  const MarkerCtor = GMap.Marker || google.maps.Marker;
  const InfoWindowCtor = GMap.InfoWindow || google.maps.InfoWindow;

  // (1) 튜닝: 포인트 50개 이하이면 클러스터러 비활성화
  const useClusterer = Boolean(window.markerClusterer?.MarkerClusterer) && list.length > 50;

  // 터치 디바이스 여부(모바일 보조용)
  const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  list.forEach(item => {
    const pos = toLatLngLiteral(item);
    if (!pos){
      console.warn('잘못된 좌표 스킵:', item?.name, item?.latitude, item?.longitude);
      return;
    }

    // 클래스 기반 InfoWindow 콘텐츠 (DOM API 사용)
    const info = new InfoWindowCtor({ content: buildIwContent(item) });

    const color = getTypeColor(item.type);
    let mk;

    if (AdvancedCtor){
      // Advanced Marker + PinElement(있으면 색 커스터마이즈)
      let content;
      if (GMap.PinElement){
        const pin = new GMap.PinElement({
          background: color,
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: 0.7, // 핀 크기
        });
        content = pin.element;
      }

      mk = new AdvancedCtor({
        position: pos,
        ...(useClusterer ? {} : { map }), // 클러스터 사용 시 map은 생략
        // (4) 튜닝: 마커 타이틀 null 가드
        title: item.name || '',
        ...(content ? { content } : {}),
      });

      mk.addListener?.('gmp-mouseover', () => {
        if (lastOpenedByClick === info) return; // 클릭 고정이면 유지
        closeAllInfo();
        info.open({ anchor: mk, map });
      });
      mk.addListener?.('gmp-mouseout', () => {
        if (lastOpenedByClick === info) return; // 클릭 고정이면 닫지 않음
        info.close();
      });

      // 클릭(모바일/데스크톱 공통): 고정 열기
      mk.addListener?.('click', () => {
        closeAllInfo();
        info.open({ anchor: mk, map });
        lastOpenedByClick = info;
      });

    } else {
      // Basic Marker + SVG 아이콘으로 색상 지정
      mk = new MarkerCtor({
        position: pos,
        ...(useClusterer ? {} : { map }),
        title: item.name || '',
        icon: makeSvgIcon(color),
        optimized: true,
      });

      mk.addListener('mouseover', () => {
        if (lastOpenedByClick === info) return; // 클릭 고정이면 유지
        closeAllInfo();
        info.open({ anchor: mk, map });
      });
      mk.addListener('mouseout', () => {
        if (lastOpenedByClick === info) return; // 클릭 고정이면 닫지 않음
        info.close();
      });

      // 클릭(모바일/데스크톱 공통): 고정 열기
      mk.addListener('click', () => {
        closeAllInfo();
        info.open({ anchor: mk, map });
        lastOpenedByClick = info;
      });

    }
    mk._info = info;
    mk._item = item;

    gMarkers.push(mk);
    gInfoWindows.push(info);
  });

  // (1) 튜닝 적용: 조건부로만 클러스터링
  if (useClusterer) {
    const renderer = {
      render({ count, position }) {
        const isRed  = count > 10;              // 10개 초과면 빨강
        const size   = count <= 10 ? 22 : 26;   // 22~26px
        const bg     = isRed ? '#dc2626' : '#2563eb';
        const border = isRed ? '#b91c1c' : '#1d4ed8';

        // AdvancedMarkerElement 우선
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

        // 기본 Marker 아이콘(SVG 원)로 폴백
        const scale = size / 2; // SymbolPath.CIRCLE은 반지름처럼 동작
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
      // gridSize: 50,  // 클러스터링 민감도 조절 가능
      onClusterClick: () => { skipNextFetchOnce = true; }
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

  list.forEach((item, idx) => {
    const pos = toLatLngLiteral(item); if (!pos) return;

    const el = buildListCard(item);

    el.addEventListener('click', () => {
      const mk = gMarkers[idx];
      if (!mk) return;

      const p = getMarkerPosition(mk) || pos;
      if (!p) return;

      map.panTo(p);
      map.setZoom(Math.max(map.getZoom(), 14));
      closeAllInfo();
      mk._info?.open({ anchor: mk, map });
      lastOpenedByClick = mk._info;
    });

    $list.appendChild(el);
  });
}

// ------- Search -------
// (3) 튜닝: toLowerCase 호출 최소화
function applySearch(raw){
  const q = raw.trim().toLowerCase();
  if (!q){ renderMarkers(allData); renderList(allData); return; }

  const filtered = allData.filter(d => {
    const name = (d.name || '').toLowerCase();
    const addr = ((d.address || d.region || '')).toLowerCase();
    const cat  = (d.category || '').toLowerCase();
    return (name.includes(q) || addr.includes(q) || cat.includes(q));
  });

  renderMarkers(filtered);
  renderList(filtered);
}

function wireSearch(){
  const $q = document.getElementById('search'); if (!$q) return;
  let t=null;
  $q.addEventListener('input', () => {
    clearTimeout(t);
    t=setTimeout(() => applySearch($q.value),150);
  });
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
}

// ------- Boot -------
document.addEventListener('DOMContentLoaded', async () => {
  try{
    const root = document.querySelector('.map-root');
    const apiKey = root?.dataset.mapsKey;
    if (!apiKey) return console.error('maps api key 누락');
    await loadGoogleMaps(apiKey);
    await initMap();
  }catch(e){ console.error(e); }
});

// ------- Viewport loader -------
let aborter = null;
let lastBboxKey = '';          // 캐시 키(라운딩된 bbox)
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
    renderMarkers(list);
    renderList(list);
  } catch (e) {
    if (e.name !== 'AbortError') console.error('지점 로드 에러:', e);
  }
}

function wireViewportLoading(){
  let t=null;
  map.addListener('idle', () => {
    // 클러스터 클릭 직후 1회는 재조회 스킵(확대 애니메이션 중 데이터 흔들림 방지)
    if (skipNextFetchOnce) {
      skipNextFetchOnce = false;
      return;
    }
    clearTimeout(t);
    t = setTimeout(fetchByViewport, 250);
  });
}

/*
(2) 접근성 포커스 링은 CSS에서 추가하세요 (map.css 예시):
.card:focus { outline: 2px solid var(--purple-400); outline-offset: 2px; }
*/
