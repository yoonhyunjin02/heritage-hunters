// ===== Globals =====
let map;
let currentType = 'heritage';
const gMarkers = [];
const gInfoWindows = [];
let allData = [];

const GMap = { Map: null, Marker: null, InfoWindow: null, AdvancedMarkerElement: null };

// ===== Utils =====
function closeAllInfo(){ gInfoWindows.forEach(iw => iw.close()); }
function clearMarkers(){
  gMarkers.forEach(m => { if (m?.setMap) m.setMap(null); else if (m) m.map = null; });
  gMarkers.length = 0; gInfoWindows.length = 0;
}
function isFiniteLatLng(lat,lng){ return Number.isFinite(lat) && Number.isFinite(lng); }
function toLatLngLiteral(item){
  const lat = Number(item.latitude), lng = Number(item.longitude);
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
  const bounds = new google.maps.LatLngBounds();

  const AdvancedCtor = GMap.AdvancedMarkerElement
    || (google.maps.marker && google.maps.marker.AdvancedMarkerElement);
  const MarkerCtor = GMap.Marker || google.maps.Marker;

  list.forEach(item => {
    const pos = toLatLngLiteral(item);
    if (!pos){ console.warn('잘못된 좌표 스킵:', item?.name, item?.latitude, item?.longitude); return; }

    let marker;
    if (AdvancedCtor){
      marker = new AdvancedCtor({ position: pos, map, title: item.name ?? '' });
      marker.addListener('gmp-click', () => {
        const info = new (GMap.InfoWindow || google.maps.InfoWindow)({
          content: `
            <div style="min-width:220px">
              <div style="font-weight:700;margin-bottom:4px">${item.name ?? ''}</div>
              <div style="font-size:12px;color:#6b7280;margin-bottom:4px">${item.region ?? ''}</div>
              <div style="font-size:12px">${item.category ?? ''}</div>
            </div>`
        });
        closeAllInfo(); info.open({ anchor: marker, map }); gInfoWindows.push(info);
      });
    } else {
      const InfoWindowCtor = GMap.InfoWindow || google.maps.InfoWindow;
      marker = new MarkerCtor({ position: pos, map, title: item.name });
      const info = new InfoWindowCtor({
        content: `
          <div style="min-width:220px">
            <div style="font-weight:700;margin-bottom:4px">${item.name ?? ''}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">${item.region ?? ''}</div>
            <div style="font-size:12px">${item.category ?? ''}</div>
          </div>`
      });
      marker.addListener('click', () => { closeAllInfo(); info.open({ anchor: marker, map }); });
      gInfoWindows.push(info);
    }

    gMarkers.push(marker);
    bounds.extend(pos);
  });

  if (!bounds.isEmpty()) map.fitBounds(bounds);
}

function renderList(list){
  const $list = document.getElementById('list'); if (!$list) return;
  $list.innerHTML = '';
  list.forEach((item, idx) => {
    const pos = toLatLngLiteral(item); if (!pos) return;
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'card';
    el.innerHTML = `
      <div class="name">${item.name ?? ''}</div>
      <div class="addr">주소: ${item.region ?? ''}</div>
      <div class="desc">${item.description ?? '설명없음'}</div>`;
    el.addEventListener('click', () => {
      const mk = gMarkers[idx]; if (!mk) return;
      const p = getMarkerPosition(mk) || pos; if (!p) return;
      map.panTo(p); map.setZoom(Math.max(map.getZoom(), 14));
      closeAllInfo();
      const InfoWindowCtor = GMap.InfoWindow || google.maps.InfoWindow;
      const info = new InfoWindowCtor({
        content: `
          <div style="min-width:220px">
            <div style="font-weight:700;margin-bottom:4px">${item.name ?? ''}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">${item.region ?? ''}</div>
            <div style="font-size:12px">${item.category ?? ''}</div>
          </div>`
      });
      info.open({ anchor: mk, map }); gInfoWindows.push(info);
    });
    $list.appendChild(el);
  });
}

// ------- Search -------
function applySearch(raw){
  const q = raw.trim().toLowerCase();
  if (!q){ renderMarkers(allData); renderList(allData); return; }
  const filtered = allData.filter(d => {
    const hay = `${d.name ?? ''} ${d.region ?? ''} ${d.category ?? ''}`.toLowerCase();
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
  loadMarkers({ type: currentType });
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
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async&callback=${cb}`;
    s.async = true; s.defer = true; s.onerror = () => reject(new Error('Google Maps JS 로드 실패'));
    document.head.appendChild(s);
  });
}

async function initMap(){
  if (google.maps.importLibrary){
    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const markerLib = await google.maps.importLibrary('marker');
    GMap.Map = Map; GMap.InfoWindow = InfoWindow;
    if (markerLib.AdvancedMarkerElement) GMap.AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
    else if (markerLib.Marker) GMap.Marker = markerLib.Marker;

    map = new GMap.Map(document.getElementById('map'), {
      center:{ lat:37.5665, lng:126.9780 }, zoom:12,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:true
    });
  } else {
    map = new google.maps.Map(document.getElementById('map'), {
      center:{ lat:37.5665, lng:126.9780 }, zoom:12,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:true
    });
  }

  wireSearch();
  wireTypeSegment();

  // 초기 UI 동기화 후 데이터 로드
  document.querySelectorAll('#typeSegment .seg-btn')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === currentType)));
  await loadMarkers({ type: currentType });
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