let autocomplete;       // 전역으로 보관
(function loadGmaps () {
  const key = document.querySelector('meta[name="gmaps-api-key"]').content;
  const s   = document.createElement('script');
  s.src     = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places&callback=initAutocomplete`;
  s.async   = true;
  s.defer   = true;
  document.head.appendChild(s);
})();

window.initAutocomplete = async function () {
  const { Autocomplete } = await google.maps.importLibrary('places');

  const input = document.getElementById('locationInput');
  if (!input) return;

  autocomplete = new Autocomplete(input, {
    componentRestrictions: { country: 'kr' },
    fields: ['formatted_address', 'geometry']
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    document.getElementById('latHidden').value = place.geometry.location.lat();
    document.getElementById('lngHidden').value = place.geometry.location.lng();
  });
};