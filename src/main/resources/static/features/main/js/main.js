/** 1) 슬라이드 데이터 */
const slides = [
  { src: '/images/main/main1.jpg', alt: '석굴암 내부 전경', label: '📍 석굴암 전실' },
  { src: '/images/main/main2.jpg', alt: '경복궁 경회루와 수양벚나무', label: '📍 경복궁 경회루' },
  { src: '/images/main/main3.jpg', alt: '경주 불국사 사리탑과 보호각', label: '📍 경주 불국사' },
  { src: '/images/main/main4.jpg', alt: '국보 정선필 인왕제색도', label: '📍 인왕제색도' },
  { src: '/images/main/main5.jpg', alt: '송례문 야경', label: '📍 숭례문 아경' },
  { src: '/images/main/main6.jpg', alt: '서울 숭례문 현판과 우진각지붕', label: '📍 숭례문 현판과 우진각지붕' },
  { src: '/images/main/main7.jpg', alt: '성산일출봉', label: '📍 성산일출봉' },
  { src: '/images/main/main8.jpg', alt: '수원 화성', label: '📍 수원 화성' },
  { src: '/images/main/main9.png', alt: '경복궁', label: '📍 경복궁' },
  { src: '/images/main/main10.jpg', alt: '향원정 전경', label: '📍 향원정' },
];


/** 2) 엘리먼트 참조 */
const imgEl    = document.getElementById('slide-img');
const labelEl  = document.getElementById('slide-label');
const dotsWrap = document.getElementById('dots');
const slideBox = document.getElementById('slideshow');

/** 3) 점(dot) 생성 */
const dots = slides.map((_, i) => {
  const d = document.createElement('span');
  d.className = 'dot';
  d.role = 'button';
  d.ariaLabel = `${i+1}번째 이미지로 이동`;
  d.addEventListener('click', () => show(i, true));
  dotsWrap.appendChild(d);
  return d;
});

/** 4) 이미지 선로딩 */
slides.forEach(s => { const img = new Image(); img.src = s.src; });

/** 5) 표시/전환 로직 */
let idx = 0;
let timer = null;
const INTERVAL = 4000;

function show(i, userAction=false){
  idx = (i + slides.length) % slides.length;
  const s = slides[idx];

  // 페이드 아웃
  imgEl.style.opacity = 0;

  // 이미지 로드 후 페이드 인
  const onLoaded = () => {
    labelEl.textContent = s.label;
    dots.forEach(d => d.classList.remove('active'));
    dots[idx].classList.add('active');
    requestAnimationFrame(()=>{ imgEl.style.opacity = 1; });
    imgEl.removeEventListener('load', onLoaded);
  };

  imgEl.addEventListener('load', onLoaded);
  imgEl.alt = s.alt;
  imgEl.src = s.src;

  if (userAction) restartAuto();
}

function next(){ show(idx + 1); }
function prev(){ show(idx - 1); }

/** 6) 자동재생 */
function startAuto(){ timer = setInterval(next, INTERVAL); }
function stopAuto(){ if (timer) clearInterval(timer); }
function restartAuto(){ stopAuto(); startAuto(); }

/** 7) 호버 시 일시정지 */
slideBox.addEventListener('mouseenter', stopAuto);
slideBox.addEventListener('mouseleave', startAuto);

/** 8) 키보드 좌우 이동 */
document.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowRight') { show(idx+1, true); }
  if (e.key === 'ArrowLeft')  { show(idx-1, true); }
});

/** 9) 스와이프(모바일) */
let touchX = null;
slideBox.addEventListener('touchstart', (e)=>{ touchX = e.changedTouches[0].clientX; }, {passive:true});
slideBox.addEventListener('touchend', (e)=>{
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40){
    dx < 0 ? show(idx+1, true) : show(idx-1, true);
  }
}, {passive:true});

/** 초기화 */
show(0);
startAuto();