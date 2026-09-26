// ===== меню на мобильных =====
const nav = document.querySelector('.nav');
const burger = document.querySelector('.nav__burger');

function setMenu(open) {
  nav.classList.toggle('nav--open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}

burger.addEventListener('click', () => setMenu(!nav.classList.contains('nav--open')));
nav.querySelectorAll('.nav__links a').forEach((link) =>
  link.addEventListener('click', () => setMenu(false))
);

// ===== шапка становится «стеклянной» после начала скролла =====
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 10);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ===== плавное появление блоков =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ===== подсветка текущего раздела в меню =====
const navLinks = document.querySelectorAll('.nav__links a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) =>
      link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`)
    );
  });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

// ===== печатающийся подзаголовок =====
const typed = document.querySelector('.typed');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (typed && !reduceMotion) {
  const words = JSON.parse(typed.dataset.words);
  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = true;

  const tick = () => {
    const word = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    typed.textContent = word.slice(0, charIndex);

    let delay = deleting ? 35 : 75;
    if (!deleting && charIndex === word.length) {
      deleting = true;
      delay = 2200;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 400;
    }
    setTimeout(tick, delay);
  };

  setTimeout(tick, 2800);
}

// ===== свечение карточек за курсором =====
document.querySelectorAll('.project').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
});

// ===== копирование почты =====
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const label = btn.textContent;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'скопировано ✓';
      btn.classList.add('is-copied');
      setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove('is-copied');
      }, 1800);
    } catch {
      // браузер не дал доступ к буферу — рядом всё равно есть mailto-ссылка
    }
  });
});
