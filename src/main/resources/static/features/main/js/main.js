/** 1) 데이터 */
const slidesData = [
  { src: '/images/main/main1.jpg',  alt: '석굴암 내부 전경',             label: '📍 석굴암 전실' },
  { src: '/images/main/main2.jpg',  alt: '경복궁 경회루와 수양벚나무',   label: '📍 경복궁 경회루' },
  { src: '/images/main/main3.jpg',  alt: '경주 불국사 사리탑과 보호각',  label: '📍 경주 불국사' },
  { src: '/images/main/main4.jpg',  alt: '국보 정선필 인왕제색도',       label: '📍 인왕제색도' },
  { src: '/images/main/main5.jpg',  alt: '숭례문 야경',                  label: '📍 숭례문 아경' },
  { src: '/images/main/main6.jpg',  alt: '서울 숭례문 현판과 우진각지붕', label: '📍 숭례문 현판과 우진각지붕' },
  { src: '/images/main/main7.jpg',  alt: '성산일출봉',                    label: '📍 성산일출봉' },
  { src: '/images/main/main8.jpg',  alt: '수원 화성',                    label: '📍 수원 화성' },
  { src: '/images/main/main9.png',  alt: '경복궁',                        label: '📍 경복궁' },
  { src: '/images/main/main10.jpg', alt: '향원정 전경',                  label: '📍 향원정' },
];

/** 2) 요소 */
const slidesWrap = document.getElementById('slides');
const dotsWrap   = document.getElementById('dots');
const slideBox   = document.getElementById('slideshow');

/** 3) 슬라이드 DOM 생성(한 번만) */
const slideEls = slidesData.map((s, i) => {
  const slide = document.createElement('div');
  slide.className = 'slide';
  slide.innerHTML = `
    <img src="${s.src}" alt="${s.alt}" loading="${i < 2 ? 'eager' : 'lazy'}">
    <div class="location-tag">${s.label}</div>
  `;
  slidesWrap.appendChild(slide);
  return slide;
});

/** 4) 도트 생성 */
const dots = slidesData.map((_, i) => {
  const d = document.createElement('span');
  d.className = 'dot';
  d.role = 'button';
  d.ariaLabel = `${i+1}번째 이미지로 이동`;
  d.addEventListener('click', () => show(i, true));
  dotsWrap.appendChild(d);
  return d;
});

/** 5) 표시/전환 (클래스만 토글) */
let idx = 0;
let timer = null;
const INTERVAL = 3500;

function show(i, userAction = false) {
  slideEls[idx].classList.remove('active');
  dots[idx].classList.remove('active');

  idx = (i + slideEls.length) % slideEls.length;

  slideEls[idx].classList.add('active');
  dots[idx].classList.add('active');

  if (userAction) restartAuto();
}
function next(){ show(idx + 1); }
function prev(){ show(idx - 1); }

/** 6) 자동재생/일시정지 */
function startAuto(){ timer = setInterval(next, INTERVAL); }
function stopAuto(){ if (timer) clearInterval(timer); }
function restartAuto(){ stopAuto(); startAuto(); }

slideBox.addEventListener('mouseenter', stopAuto);
slideBox.addEventListener('mouseleave', startAuto);

document.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowRight') show(idx+1, true);
  if (e.key === 'ArrowLeft')  show(idx-1, true);
});

/** 7) 스와이프 */
let touchX = null;
slideBox.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, {passive:true});
slideBox.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) (dx < 0 ? show(idx+1, true) : show(idx-1, true));
}, {passive:true});

/** 초기화 */
slideEls[0].classList.add('active');
dots[0].classList.add('active');
startAuto();
