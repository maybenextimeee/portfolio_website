// Анимации играют сами, когда блок появляется на экране (без привязки к прокрутке).
// Если листают быстро вниз — то, что сейчас играет, ускоряется, а то, что уже пролистано, сразу доигрывается.
//
// Разметка: блок-триггер с атрибутом [data-play]; внутри него (или он сам) элементы с классом .rv
// получают анимацию появления. Задержка — через --d, длительность — через --dur.
(() => {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = document.createElement('style');
  css.textContent = `
    .js [data-play] .rv, .js .rv[data-play] { opacity: 0; }
    .play .rv, .rv.play { animation: rv var(--dur, .9s) cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d, 0s); }
    .rv.done { animation: none !important; opacity: 1 !important; }
    @keyframes rv { from { opacity: 0; transform: translateY(26px); filter: blur(8px); } to { opacity: 1; transform: none; filter: none; } }
    @media (hover: none) { @keyframes rv { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } } }
    @media (prefers-reduced-motion: reduce) { .js [data-play] .rv, .js .rv[data-play] { opacity: 1; } .play .rv, .rv.play { animation: none; } }`;
  document.head.append(css);

  // анимация доиграла — снимаем её, чтобы не мешала hover-эффектам
  addEventListener('animationend', (e) => { if (e.animationName === 'rv') e.target.classList.add('done'); });

  const start = (el) => { if (!el.classList.contains('play')) { el.classList.add('play'); el.dispatchEvent(new CustomEvent('play')); } };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { start(e.target); io.unobserve(e.target); } }),
    { threshold: .15, rootMargin: '0px 0px -6% 0px' });

  // наша ли это анимация (а не вечные облака / бегущая строка)
  const ours = (a) => {
    const t = a.effect && a.effect.target;
    return t && t.closest && t.closest('[data-play]') && a.effect.getTiming().iterations !== Infinity;
  };
  const finishIn = (el) => el.getAnimations({ subtree: true }).forEach((a) => { if (ours(a)) try { a.finish(); } catch {} });

  let lastY = scrollY, lastT = performance.now(), calm;
  addEventListener('scroll', () => {
    const now = performance.now(), dy = scrollY - lastY, v = dy / Math.max(now - lastT, 1);
    lastY = scrollY; lastT = now;
    if (dy <= 0 || reduce) return;
    // всё, что уже ушло вверх за экран, показываем сразу целиком
    document.querySelectorAll('[data-play]').forEach((el) => {
      if (el.getBoundingClientRect().bottom < 0) { start(el); finishIn(el); }
    });
    // листают быстро — проигрываем текущие анимации вчетверо быстрее
    if (v > .9) {
      document.getAnimations().forEach((a) => { if (a.playState === 'running' && ours(a)) a.playbackRate = 4; });
      clearTimeout(calm);
      calm = setTimeout(() => document.getAnimations().forEach((a) => { if (ours(a)) a.playbackRate = 1; }), 300);
    }
  }, { passive: true });

  // стартуем, когда загрузились шрифты (чтобы первый экран не дёргался), но ждём не дольше 0,6 с
  const go = () => document.querySelectorAll('[data-play]').forEach((el) => io.observe(el));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 600))]).then(go);
})();
