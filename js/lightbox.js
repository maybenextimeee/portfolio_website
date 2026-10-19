// Просмотр фото на весь экран: картинка плавно вырастает из миниатюры и так же возвращается.
// Разметка: <img data-zoom="группа">. Внутри группы листаются стрелками, клавишами ← → и свайпом. Esc — закрыть.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(.2,.8,.2,1)';
  const css = document.createElement('style');
  css.textContent = `
    img[data-zoom] { cursor: zoom-in; }
    .lb { position: fixed; inset: 0; z-index: 2147483100; display: none; }
    .lb.open { display: block; }
    .lb-bg { position: absolute; inset: 0; background: rgba(14, 16, 24, .72); backdrop-filter: blur(18px) saturate(120%); -webkit-backdrop-filter: blur(18px) saturate(120%); opacity: 0; }
    .lb-img { position: absolute; left: 0; top: 0; object-fit: cover; transform-origin: 50% 50%; box-shadow: 0 40px 120px -30px rgba(0,0,0,.6); will-change: transform; user-select: none; -webkit-user-drag: none; }
    .lb-ui { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .3s; }
    .lb.ready .lb-ui { opacity: 1; }
    .lb-ui button { pointer-events: auto; position: absolute; width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(255,255,255,.25);
      background: rgba(255,255,255,.12); color: #fff; font: 400 22px/1 system-ui, sans-serif; cursor: pointer; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: background .25s, transform .25s; }
    .lb-ui button:hover { background: rgba(255,255,255,.24); transform: scale(1.06); }
    .lb-x { top: 20px; right: 20px; }
    .lb-prev { left: 20px; top: 50%; margin-top: -24px; } .lb-next { right: 20px; top: 50%; margin-top: -24px; }
    .lb-count { position: absolute; left: 50%; bottom: 24px; translate: -50% 0; color: rgba(255,255,255,.8); font: 500 13px/1 system-ui, sans-serif; letter-spacing: .08em; }
    .lb.single .lb-prev, .lb.single .lb-next, .lb.single .lb-count { display: none; }
    @media (max-width: 640px) { .lb-prev, .lb-next { top: auto; bottom: 14px; margin: 0; } .lb-count { bottom: 30px; } }`;
  document.head.append(css);

  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = `<div class="lb-bg"></div><img class="lb-img" alt="">
    <div class="lb-ui"><button class="lb-x" aria-label="Закрыть">✕</button><button class="lb-prev" aria-label="Назад">←</button>
    <button class="lb-next" aria-label="Дальше">→</button><div class="lb-count"></div></div>`;
  document.body.append(lb);
  const bg = lb.querySelector('.lb-bg'), big = lb.querySelector('.lb-img'), count = lb.querySelector('.lb-count');
  let group = [], idx = 0, thumb = null, busy = false;

  const fit = (img) => { // куда встаёт большая картинка: по центру, не больше 88% ширины и 86% высоты экрана
    const ar = (img.naturalWidth || 4) / (img.naturalHeight || 5);
    let h = innerHeight * .86, w = h * ar;
    if (w > innerWidth * .88) { w = innerWidth * .88; h = w / ar; }
    return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
  };
  const place = (r) => { Object.assign(big.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); };
  // наклон и масштаб миниатюры с учётом родителей (полароиды повёрнуты на несколько градусов)
  const geo = (t) => {
    let angle = 0, scale = 1;
    for (let n = t; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.rotate && cs.rotate !== 'none') angle += parseFloat(cs.rotate) || 0;
      if (cs.scale && cs.scale !== 'none') scale *= parseFloat(cs.scale) || 1;
      if (cs.transform && cs.transform !== 'none') {
        const m = new DOMMatrix(cs.transform);
        angle += Math.atan2(m.b, m.a) * 180 / Math.PI; scale *= Math.hypot(m.a, m.b);
      }
    }
    return { angle, scale };
  };
  // transform, который ставит большую картинку точно на место миниатюры: по центру, с тем же наклоном и размером
  const flip = (t, r) => {
    const b = t.getBoundingClientRect(), { angle, scale } = geo(t);
    const w = t.offsetWidth * scale, h = t.offsetHeight * scale;
    const dx = b.left + b.width / 2 - (r.left + r.width / 2), dy = b.top + b.height / 2 - (r.top + r.height / 2);
    const k = w / r.width;
    return { transform: `translate(${dx}px, ${dy}px) rotate(${angle}deg) scale(${k}, ${h / r.height})`, radius: (parseFloat(getComputedStyle(t).borderRadius) || 0) / k + 'px' };
  };
  const ease2 = 'cubic-bezier(.32, .72, 0, 1)'; // мягкое «как в iOS»

  function open(t) {
    if (busy) return; busy = true;
    thumb = t; group = [...document.querySelectorAll(`img[data-zoom="${t.dataset.zoom}"]`)]; idx = group.indexOf(t);
    lb.classList.toggle('single', group.length < 2);
    big.src = t.currentSrc || t.src; big.alt = t.alt;
    const r = fit(t); place(r); lb.classList.add('open');
    count.textContent = `${idx + 1} / ${group.length}`;
    const start = flip(t, r);
    t.style.visibility = 'hidden';
    const d = reduce ? 1 : 600;
    big.animate([{ transform: start.transform, borderRadius: start.radius }, { transform: 'none', borderRadius: '22px' }], { duration: d, easing: ease2, fill: 'both' });
    bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: d * .8, easing: 'ease-out', fill: 'both' }).onfinish = () => { lb.classList.add('ready'); busy = false; };
  }
  function close() {
    if (busy || !lb.classList.contains('open')) return; busy = true;
    lb.classList.remove('ready');
    const t = group[idx], r = fit(t), d = reduce ? 1 : 560;
    const visible = t.getBoundingClientRect(), onScreen = visible.bottom > 0 && visible.top < innerHeight;
    const end = flip(t, r);
    // текущее положение берём из уже идущей анимации, чтобы не было скачка, если закрыли сразу после листания
    const now = getComputedStyle(big).transform;
    const anim = onScreen
      ? big.animate([{ transform: now === 'none' ? 'none' : now, borderRadius: '22px' }, { transform: end.transform, borderRadius: end.radius }], { duration: d, easing: ease2, fill: 'both' })
      : big.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.92)' }], { duration: d * .6, easing: 'ease-in', fill: 'both' });
    bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: d * .9, easing: 'ease-in-out', fill: 'both' });
    anim.onfinish = () => {
      group.forEach((g) => (g.style.visibility = ''));
      lb.classList.remove('open'); big.getAnimations().forEach((a) => a.cancel()); busy = false;
    };
  }
  function go(step) {
    if (busy || group.length < 2) return; busy = true;
    const prev = group[idx];
    idx = (idx + step + group.length) % group.length;
    const t = group[idx];
    prev.style.visibility = ''; t.style.visibility = 'hidden';
    const out = big.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-step * 40}px)` }], { duration: 200, easing: 'ease-in', fill: 'both' });
    out.onfinish = () => {
      big.src = t.currentSrc || t.src; place(fit(t));
      count.textContent = `${idx + 1} / ${group.length}`;
      big.animate([{ opacity: 0, transform: `translateX(${step * 40}px)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: ease, fill: 'both' }).onfinish = () => (busy = false);
    };
  }

  document.addEventListener('click', (e) => { const t = e.target.closest('img[data-zoom]'); if (t && !lb.contains(t)) { e.preventDefault(); open(t); } });
  bg.addEventListener('click', close);
  big.addEventListener('click', close);
  lb.querySelector('.lb-x').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', () => go(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => go(1));
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1);
    if ([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) e.preventDefault();
  });
  // пока фото открыто, страница под ним не прокручивается. Полосу прокрутки не прячем — иначе страница съезжает вбок
  const stop = (e) => { if (lb.classList.contains('open')) e.preventDefault(); };
  addEventListener('wheel', stop, { passive: false });
  addEventListener('touchmove', stop, { passive: false });
  let sx = null;
  lb.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); sx = null; });
  addEventListener('resize', () => { if (lb.classList.contains('open') && !busy) place(fit(group[idx])); });
})();
