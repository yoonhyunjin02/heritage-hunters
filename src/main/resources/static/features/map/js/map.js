// ===== Globals =====
let map;
let currentType = 'all';
const gMarkers = [];
const gInfoWindows = [];
let allData = [];
window.allowAdvanced = false;

let clusterer = null;

const GMap = { Map: null, Marker: null, InfoWindow: null, AdvancedMarkerElement: null, PinElement: null };

// ===== Utils =====
function closeAllInfo(){ gInfoWindows.forEach(iw => iw.close()); }
function clearMarkers(){
  // 클러스터러 먼저 정리
  if (clusterer?.clearMarkers) clusterer.clearMarkers();
  clusterer = null;

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

// ------- Data load -------
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

  const AdvancedCtor = (window.allowAdvanced)
    ? (GMap.AdvancedMarkerElement || (google.maps.marker && google.maps.marker.AdvancedMarkerElement))
    : null;
  const MarkerCtor = GMap.Marker || google.maps.Marker;
  const InfoWindowCtor = GMap.InfoWindow || google.maps.InfoWindow;

  list.forEach(item => {
    const pos = toLatLngLiteral(item);
    if (!pos){
      console.warn('잘못된 좌표 스킵:', item?.name, item?.latitude, item?.longitude);
      return;
    }

    // InfoWindow: 한 번만 만들고 양 분기에서 공통 사용
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

    let mk; // 두 분기에서 공통으로 쓸 마커 변수

    if (AdvancedCtor){
      // 타입별 색상 결정
      const color = item.type === 'museum' ? '#2563eb' : '#dc2626'; // 박물관=파랑, 문화재=빨강 예시
      let content = undefined;
      if (GMap.PinElement) {
        const pin = new GMap.PinElement({
          background: color,
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: 1.0, // 크기 조절
        });
        content = pin.element;
      }

      mk = new AdvancedCtor({
        position: pos,
        map,
        title: item.name ?? '',
        ...(content ? { content } : {}), // PinElement 없으면 기본 고급마커 사용
      });
      mk.addListener('gmp-click',      () => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('gmp-mouseover', () => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('gmp-mouseout',  () => { info.close(); });
    } else {
      mk = new MarkerCtor({ position: pos, map, title: item.name ?? '' });
      mk.addListener('click',      () => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('mouseover', () => { closeAllInfo(); info.open({ anchor: mk, map }); });
      mk.addListener?.('mouseout',  () => { info.close(); });
    }

    // 리스트 클릭에서 재사용할 참조
    mk._info = info;
    mk._item = item;

    gMarkers.push(mk);
    gInfoWindows.push(info);
  });

  // 클러스터링 적용
    if (window.markerClusterer?.MarkerClusterer) {
      clusterer = new markerClusterer.MarkerClusterer({
        map,
        markers: gMarkers,
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

      // 마커에 미리 붙여둔 InfoWindow 재사용
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
  renderMarkers(filtered); renderList(filtered);
}
function wireSearch(){
  const $q = document.getElementById('search'); if (!$q) return;
  let t=null;
  $q.addEventListener('input', () => { clearTimeout(t); t=setTimeout(() => applySearch($q.value),150); });
}

// ------- 세그먼트 토글 -------
function setType(type){
  currentType = type;
  document.querySelectorAll('#typeSegment .seg-btn')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === type)));
  lastBboxStr = '';        // 타입 바뀌면 강제로 다시 로드
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
    s.async = true; s.defer = true; s.onerror = () => reject(new Error('Google Maps JS 로드 실패'));
    document.head.appendChild(s);
  });
}

async function initMap(){
  if (google.maps.importLibrary){
    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const markerLib = await google.maps.importLibrary('marker'); // AdvancedMarkerElement, PinElement 제공
    GMap.Map = Map; GMap.InfoWindow = InfoWindow;
    // AdvancedMarkerElement는 '벡터 맵(Map ID)'에서만 지원 → map 생성 후 mapId 유무로 폴백
    if (markerLib.AdvancedMarkerElement) GMap.AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
    if (markerLib.PinElement)            GMap.PinElement            = markerLib.PinElement;
    else if (markerLib.Marker)           GMap.Marker                = markerLib.Marker;

    // data-map-id 읽기
    const root = document.querySelector('.map-root');
    const mapId = root?.dataset.mapId || null;

    const mapOptions = {
      center:{ lat:37.5665, lng:126.9780 }, zoom:12,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:true
    };
    if (mapId) mapOptions.mapId = mapId; // 벡터 지도 활성화
    map = new GMap.Map(document.getElementById('map'), mapOptions);

    // AdvancedMarker 사용 가능 플래그
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
    wireViewportLoading();   // idle에서 첫 로딩까지 자동
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

let aborter = null;
let lastBboxStr = '';   // 직전 요청의 bbox 캐시

function getBboxFromMap() {
  if (!map || !map.getBounds) return null;
  const b = map.getBounds(); if (!b) return null;
  const ne = b.getNorthEast(), sw = b.getSouthWest();
  return { south: sw.lat(), west: sw.lng(), north: ne.lat(), east: ne.lng() };
}

async function fetchByViewport() {
  const bbox = getBboxFromMap(); if (!bbox) return;

  const bboxStr = `${bbox.south.toFixed(5)},${bbox.west.toFixed(5)},${bbox.north.toFixed(5)},${bbox.east.toFixed(5)}`;
  if (bboxStr === lastBboxStr) return;   // 같은 뷰포트면 재요청 안함
  lastBboxStr = bboxStr;

  // 직전 요청이 있다면 취소 (취소 시 콘솔에 찍지 않음)
  if (aborter) aborter.abort();
  aborter = new AbortController();

  const url = new URL('/map/points', window.location.origin);
  url.searchParams.set('bbox', bboxStr);
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
    if (e.name === 'AbortError') return;       // 사용자가 지도를 계속 움직여서 취소된 경우: 무시
    console.error('지점 로드 에러:', e);        // 네트워크/서버 에러만 찍기
  }
}

function wireViewportLoading(){
  let t=null;
  map.addListener('idle', () => {
    clearTimeout(t);
    t = setTimeout(fetchByViewport, 250); // 150 → 250
  });
}

const useClusterer = Boolean(window.markerClusterer?.MarkerClusterer);

if (AdvancedCtor){
  const color = item.type === 'museum' ? '#2563eb' : '#dc2626';
  let content = undefined;
  if (GMap.PinElement) {
    const pin = new GMap.PinElement({
      background: color, borderColor: '#ffffff', glyphColor: '#ffffff', scale: 1.0
    });
    content = pin.element;
  }
  mk = new AdvancedCtor({
    position: pos,
    ...(useClusterer ? {} : { map }),   // ★ 클러스터 사용 시 map 생략
    title: item.name ?? '',
    ...(content ? { content } : {}),
  });
  // 이벤트…
} else {
  mk = new MarkerCtor({
    position: pos,
    ...(useClusterer ? {} : { map }),   // ★
    title: item.name ?? ''
  });
  // 이벤트…
}

if (useClusterer) {
  clusterer = new markerClusterer.MarkerClusterer({ map, markers: gMarkers });
}

function makeSvgIcon(color='#dc2626'){
  const svg = {
    path: "M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7z",
    fillColor: color, fillOpacity: 1, strokeWeight: 1, strokeColor: '#fff', scale: 1
  };
  return svg;
}

// … Marker 생성 시
const color = item.type === 'museum' ? '#2563eb' : '#dc2626';
mk = new MarkerCtor({
  position: pos,
  ...(useClusterer ? {} : { map }),
  title: item.name ?? '',
  icon: makeSvgIcon(color),      // ★ 색상 지정
  optimized: true
});
