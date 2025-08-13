// ===== Globals =====
let map;
let currentType = 'all';
const gMarkers = [];
const gInfoWindows = [];
let allData = [];
let clusterer = null;

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
  // 박물관/미술관: 파랑, 문화재: 빨강 (필요시 여기서 색 바꾸면 전체 반영)
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

  // 클러스터러 사용 가능 여부
  const useClusterer = Boolean(window.markerClusterer?.MarkerClusterer);

  list.forEach(item => {
    const pos = toLatLngLiteral(item);
    if (!pos){
      console.warn('잘못된 좌표 스킵:', item?.name, item?.latitude, item?.longitude);
      return;
    }

    const info = new InfoWindowCtor({
      content: `
        <div style="min-width:220px">
          <div style="font-weight:700;margin-bottom:4px">${item.name ?? ''}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">
            ${item.address ?? item.region ?? ''}
          </div>
          <div style="font-size:12px">${item.category ?? ''}</div>
        </div>`
    });

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
          scale: 1.0,
        });
        content = pin.element;
      }

      mk = new AdvancedCtor({
        position: pos,
        ...(useClusterer ? {} : { map }), // 클러스터 사용 시 map은 생략
        title: item.name ?? '',
        ...(content ? { content } : {}),
      });

      mk.addListener('gmp-click',       () => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('gmp-mouseover', () => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('gmp-mouseout',  () => { info.close(); });
    } else {
      // Basic Marker + SVG 아이콘으로 색상 지정
      mk = new MarkerCtor({
        position: pos,
        ...(useClusterer ? {} : { map }),
        title: item.name ?? '',
        icon: makeSvgIcon(color),
        optimized: true,
      });

      mk.addListener('click',      () => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('mouseover',() => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('mouseout', () => { info.close(); });
    }

    mk._info = info;
    mk._item = item;

    gMarkers.push(mk);
    gInfoWindows.push(info);
  });

  // 클러스터링 적용 (+ 클러스터 클릭 시 1회 재조회 스킵 콜백)
  if (window.markerClusterer?.MarkerClusterer){
    clusterer = new markerClusterer.MarkerClusterer({
      map,
      markers: gMarkers,
      // 라이브러리 버전에 따라 onClusterClick 미지원일 수 있으니 보호적 접근
      ...(typeof markerClusterer.MarkerClusterer === 'function' ? {
        onClusterClick: () => { skipNextFetchOnce = true; }
      } : {})
    });
  }
}

function renderList(list){
  const $list = document.getElementById('list'); if (!$list) return;
  $list.innerHTML = '';

  list.forEach((item, idx) => {
    const pos = toLatLngLiteral(item); if (!pos) return;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'card';
    el.innerHTML = `
      <div class="name">${item.name ?? ''}</div>
      <div class="addr">주소: ${item.address ?? item.region ?? ''}</div>
      <div class="desc">${item.category ?? ''}</div>
    `;

    el.addEventListener('click', () => {
      const mk = gMarkers[idx];
      if (!mk) return;

      const p = getMarkerPosition(mk) || pos;
      if (!p) return;

      map.panTo(p);
      map.setZoom(Math.max(map.getZoom(), 14));
      closeAllInfo();
      mk._info?.open({ anchor: mk, map });
    });

    $list.appendChild(el);
  });
}

// ------- Search -------
function applySearch(raw){
  const q = raw.trim().toLowerCase();
  if (!q){ renderMarkers(allData); renderList(allData); return; }
  const filtered = allData.filter(d => {
    const hay = `${d.name ?? ''} ${d.region ?? ''} ${d.address ?? ''} ${d.category ?? ''}`.toLowerCase();
    return hay.includes(q);
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

// ------- 세그먼트 토글 -------
function setType(type){
  currentType = type;
  document.querySelectorAll('#typeSegment .seg-btn')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === type)));
  lastBboxKey = '';           // 타입 바뀌면 동일 뷰포트라도 다시 요청
  fetchByViewport();
}

function wireTypeSegment(){
  const seg = document.getElementById('typeSegment'); if(!seg) return;
  seg.addEventListener('click', (e)=>{
    const btn = e.target.closest('.seg-btn'); if(!btn) return;
    if (btn.getAttribute('aria-pressed') === 'true') return;
    setType(btn.dataset.type);
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