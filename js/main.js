// ===== страница: облака, переключатель темы, шапка, видео, копирование почты =====
// Анимации появления — в play.js, просмотр фото на весь экран — в lightbox.js.

// иконка GitHub во всех кнопках «GitHub» и в плашке с никнеймом
const gh = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
document.querySelectorAll('.gh').forEach((a) => a.insertAdjacentHTML('afterbegin', gh));

// переключатель темы: плавно меняет цвета и запоминает выбор
const root = document.documentElement;
document.getElementById('theme').addEventListener('click', () => {
  root.classList.add('theme-anim');
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  // цвет панелей браузера (Chrome на Android, старые iOS) — как --edge в style.css
  document.querySelector('meta[name=theme-color]').content = root.dataset.theme === 'light' ? '#e4e8fb' : '#17173f';
  clearTimeout(window.__ta); window.__ta = setTimeout(() => root.classList.remove('theme-anim'), 700);
});

// облака
const layerDark = document.querySelector('.layer.dark');
const sz = Math.min(1, .45 + innerWidth / 1800);
const cloudBox = document.createElement('div'); cloudBox.style.cssText = 'position:absolute;inset:0'; document.getElementById('sky').append(cloudBox);
const cloudEls = [
  { x: 4, y: 20, s: 1, t: 70, p: .2 }, { x: 66, y: 8, s: .8, t: 86, p: .3 }, { x: 74, y: 48, s: 1.2, t: 64, p: .4 },
  { x: -6, y: 62, s: .9, t: 78, p: .5 }, { x: 36, y: 82, s: 1.3, t: 72, p: .35 },
].map((c, n) => {
  const s = c.s * sz, wrap = document.createElement('div');
  wrap.className = 'cloud'; wrap.style.cssText = `left:${c.x}vw;top:${c.y}vh;width:${380 * s}px;height:${160 * s}px`;
  [[0, 40, 46], [22, 10, 58], [48, 22, 50], [70, 38, 40], [14, 52, 34], [40, 54, 44]].forEach(([l, t, d]) => {
    // круг крупнее, чем виден: мягкий край — маской (см. .cloud i в style.css)
    const i = document.createElement('i'); i.style.cssText = `left:${l}%;top:${t}%;width:${d * s * 5}px;height:${d * s * 5}px`; wrap.append(i);
  });
  const drift = document.createElement('div'); drift.className = 'drift'; drift.style.setProperty('--t', c.t + 's'); drift.style.animationDelay = -(n * 15) + 's';
  drift.append(wrap); cloudBox.append(drift);
  return { el: wrap, p: c.p };
});
// облака чуть следуют за курсором — только где есть мышь (на телефоне это лишняя работа во время прокрутки)
if (matchMedia('(hover: hover)').matches) addEventListener('pointermove', (e) => {
  const mx = e.clientX / innerWidth - .5, my = e.clientY / innerHeight - .5;
  cloudEls.forEach(({ el, p }) => (el.style.transform = `translate(${mx * 90 * p}px, ${my * 50 * p}px)`));
}, { passive: true });

const header = document.getElementById('top');
addEventListener('scroll', () => header.classList.toggle('on', scrollY > innerHeight * .5), { passive: true });

// видео (оно без звука): играет, только пока карточка на экране
const box = document.getElementById('nsVideo'), video = box.querySelector('video');
new IntersectionObserver(([e]) => { e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }, { threshold: .35 }).observe(box);

document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'скопировано ✓'; b.classList.add('ok'); setTimeout(() => { b.textContent = 'копировать'; b.classList.remove('ok'); }, 1600); } catch {}
}));

// цифры 18 / 14 / 3 считаются от нуля, когда блок появляется на экране
// (раньше считал CSS через @property — на iPhone цифра не перерисовывалась и висел 0)
const nums = document.querySelector('.nums');
if (nums && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const els = [...nums.querySelectorAll('.num')];
  els.forEach((el) => (el.textContent = '0'));
  nums.addEventListener('play', () => els.forEach((el, n) => {
    const to = +el.dataset.to, delay = 200 + n * 120, dur = 1600, t0 = performance.now() + delay;
    const tick = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / dur));
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { once: true });
}

// кнопка «Наверх» в самом низу
document.getElementById('totop').addEventListener('click', (e) => { scrollTo({ top: 0, behavior: 'smooth' }); e.currentTarget.blur(); });
