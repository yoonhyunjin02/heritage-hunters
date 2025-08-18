// my_location.js

let myPosMarker = null;
let myAccCircle = null;

function getCurrentPositionOnce(options = { enableHighAccuracy:true, timeout:10000, maximumAge:0 }){
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !isLocal) {
      return reject(new Error('HTTPS에서만 위치 기능을 사용할 수 있어요.'));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function fetchNearby(lat, lng, radius = 2000, type = currentType, limit = 200){
  const url = new URL('/map/nearby', window.location.origin);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lng', lng);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('type', type || 'all');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('nearby 요청 실패: ' + res.status);
  return res.json();
}

async function panToMyLocation(){
  try{
    const pos = await getCurrentPositionOnce();
    const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const acc = Math.max(10, pos.coords.accuracy || 0);

    if (!myPosMarker){
      if (window.allowAdvanced && GMap.AdvancedMarkerElement && GMap.PinElement){
        const pin = new GMap.PinElement({ background:'#10b981', borderColor:'#fff', glyphColor:'#fff', scale:0.7 });
        myPosMarker = new GMap.AdvancedMarkerElement({ position: latlng, map, content: pin.element, title:'내 위치' });
      } else {
        myPosMarker = new (GMap.Marker || google.maps.Marker)({
          position: latlng, map, title:'내 위치',
          icon:{ path:google.maps.SymbolPath.CIRCLE, scale:6, fillColor:'#10b981', fillOpacity:1, strokeColor:'#fff', strokeWeight:2 }
        });
      }
    } else {
      myPosMarker.setMap?.(map);
      myPosMarker.position ? (myPosMarker.position = latlng) : myPosMarker.setPosition?.(latlng);
    }

    if (!myAccCircle){
      myAccCircle = new google.maps.Circle({
        map, center: latlng, radius: acc,
        strokeColor:'#10b981', strokeOpacity:0.6, strokeWeight:1,
        fillColor:'#10b981', fillOpacity:0.15, clickable:false
      });
    } else {
      myAccCircle.setMap(map);
      myAccCircle.setCenter(latlng);
      myAccCircle.setRadius(acc);
    }

    const b = myAccCircle.getBounds?.();
    if (b) {
      map.fitBounds(b, 80);
      const once = map.addListener('idle', () => {
        if (map.getZoom() > 17) map.setZoom(17);
        google.maps.event.removeListener(once);
      });
    } else {
      map.panTo(latlng);
      map.setZoom(Math.max(15, map.getZoom() || 0));
    }

    const list = await fetchNearby(latlng.lat, latlng.lng, 2000, currentType, 200);

    // 사이드바에 내 위치 공유 → 가까운 순 정렬 버튼 활성
    if (window.__sidebar?.setMyLocationForSidebar) {
      window.__sidebar.setMyLocationForSidebar(latlng.lat, latlng.lng);
    }

    allData = list;
    const filtered = (window.__sidebar?.updateSidebar)
      ? window.__sidebar.updateSidebar(list)
      : list;
    renderMarkers(filtered);
    renderList(filtered);


    skipNextFetchOnce = true;

  } catch(err){
    console.warn('위치 가져오기 실패:', err);
    alert(err.message || '현재 위치를 가져오지 못했습니다.');
  }
}

function wireLocateButton(){
  const btn = document.getElementById('locateBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.setAttribute('aria-busy','true');
    try { await panToMyLocation(); }
    finally { btn.disabled = false; btn.removeAttribute('aria-busy'); }
  });
}

// 전역 노출
window.wireLocateButton = wireLocateButton;
window.panToMyLocation = panToMyLocation;