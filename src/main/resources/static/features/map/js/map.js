// ===== Globals =====
let map;
let currentType = 'all';
const gMarkers = [];
const gInfoWindows = [];
let allData = [];

// Google Maps 클래스 캐시
const GMap = { Map: null, Marker: null, InfoWindow: null };

// ===== Utils =====
function closeAllInfo() {
  gInfoWindows.forEach(iw => iw.close());
}
function clearMarkers() {
  gMarkers.forEach(m => m.setMap(null));
  gMarkers.length = 0;
  gInfoWindows.length = 0;
}

// ------- Data load -------
async function loadMarkers(params = {}) {
  const endpoint = document.querySelector('.map-root').dataset.endpoint || '/map';

  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('type', params.type || currentType || 'all');
  if (params.designation) url.searchParams.set('designation', params.designation);
  if (params.region)      url.searchParams.set('region', params.region);
  if (params.era)         url.searchParams.set('era', params.era);

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    console.error('마커 로드 실패', res.status);
    return;
  }
  allData = await res.json();
  renderMarkers(allData);
  renderList(allData);
}

// ------- Markers / List -------
function renderMarkers(list) {
  clearMarkers();

  const bounds = new google.maps.LatLngBounds();

  // 폴백: 신형(GMap) 없으면 클래식(google.maps.*) 사용
  const MarkerCtor = GMap.Marker || google.maps.Marker;
  const InfoWindowCtor = GMap.InfoWindow || google.maps.InfoWindow;

  list.forEach((item, idx) => {
    const pos = { lat: item.latitude, lng: item.longitude };
    const marker = new MarkerCtor({
      position: pos,
      map,
      title: item.name
    });

    const content = `
      <div style="min-width:220px">
        <div style="font-weight:700;margin-bottom:4px">${item.name ?? ''}</div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px">${item.region ?? ''}</div>
        <div style="font-size:12px">${item.category ?? ''}</div>
      </div>
    `;
    const info = new InfoWindowCtor({ content });

    marker.addListener('click', () => {
      closeAllInfo();
      info.open({ anchor: marker, map });
    });

    gMarkers.push(marker);
    gInfoWindows.push(info);
    bounds.extend(pos);
  });

  if (!bounds.isEmpty()) map.fitBounds(bounds);
}

function renderList(list) {
  const $list = document.getElementById('list');
  if (!$list) return;
  $list.innerHTML = '';

  list.forEach((item, idx) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'card';
    el.innerHTML = `
      <div class="name">${item.name ?? ''}</div>
      <div class="addr">주소: ${item.region ?? ''}</div>
      <div class="desc">${item.description ?? '설명없음'}</div>
    `;
    el.addEventListener('click', () => {
      const mk = gMarkers[idx];
      if (!mk) return;
      map.panTo(mk.getPosition());
      map.setZoom(Math.max(map.getZoom(), 14));
      closeAllInfo();
      gInfoWindows[idx]?.open({ anchor: mk, map });
    });
    $list.appendChild(el);
  });
}

// ------- Search -------
function applySearch(raw) {
  const q = raw.trim().toLowerCase();
  if (!q) {
    renderMarkers(allData);
    renderList(allData);
    return;
  }
  const filtered = allData.filter(d => {
    const hay = `${d.name ?? ''} ${d.region ?? ''} ${d.category ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
  renderMarkers(filtered);
  renderList(filtered);
}

function wireSearch() {
  const $q = document.getElementById('search');
  if (!$q) return;
  let t = null;
  $q.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => applySearch($q.value), 150);
  });
}

// ------- Filter dropdown -------
function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-chip').forEach(c =>
    c.setAttribute('aria-pressed', String(c.dataset.type === type))
  );
  loadMarkers({ type: currentType });
}

(function wireFilterDropdown(){
  const btn = document.getElementById('filterBtn');
  const panel = document.getElementById('filterPanel');
  if (!btn || !panel) return;

  const open = () => { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); };
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? close() : open();
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) close();
  });

  panel.addEventListener('click', (e) => {
    const chip = e.target.closest('.type-chip');
    if (!chip) return;
    setType(chip.dataset.type || 'all');
    close();
  });
})();

// ------- Google loader & init -------
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();

    // 일부 환경에서 importLibrary가 없을 수 있으니 callback도 걸어둠
    const cbName = '__gm_cb_' + Math.random().toString(36).slice(2);
    window[cbName] = () => resolve();

    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async&callback=${cbName}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error('Google Maps JS 로드 실패'));
    document.head.appendChild(s);
  });
}


async function initMap() {
  if (google.maps.importLibrary) {
    // 신형 로더
    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const { Marker } = await google.maps.importLibrary('marker');
    GMap.Map = Map;
    GMap.Marker = Marker;
    GMap.InfoWindow = InfoWindow;

    map = new GMap.Map(document.getElementById('map'), {
      center: { lat: 37.5665, lng: 126.9780 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });
  } else {
    // 폴백(클래식 생성자)
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 37.5665, lng: 126.9780 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });
    // GMap 캐시는 비워둬도 위에서 폴백 생성자를 쓰기 때문에 문제 없음
  }

  wireSearch();

  const activeChip = document.querySelector('.type-chip[aria-pressed="true"]');
  currentType = activeChip?.dataset.type || 'all';
  await loadMarkers({ type: currentType });
}


// ------- Boot -------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const root = document.querySelector('.map-root');
    const apiKey = root?.dataset.mapsKey;
    if (!apiKey) return console.error('maps api key 누락');

    await loadGoogleMaps(apiKey);
    await initMap();
  } catch (e) {
    console.error(e);
  }
});