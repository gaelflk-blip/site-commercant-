/* Büse : animations (GSAP + ScrollTrigger + SplitText, défilement fluide Lenis sur ordinateur).
   Signature : les trois grains du logo tombent dans le « U » qui sourit. */
(function () {
  var root = document.documentElement;
  var top = document.querySelector('.top');
  function onScroll() { top.classList.toggle('scrolled', window.scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (!window.gsap || !window.ScrollTrigger || !root.classList.contains('anim')) { root.classList.remove('anim'); return; }
  window.__animReady = true;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var touch = matchMedia('(pointer: coarse)').matches;
  if (window.Lenis && !touch) {
    var lenis = new Lenis({ duration: 1.1, anchors: { offset: -70 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var mm = gsap.matchMedia();
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(function (r) { setTimeout(r, 800); })]).then(function () {
    mm.add('(prefers-reduced-motion: no-preference)', function () {

      /* ---------- 1. Ouverture : le logo, puis les grains tombent dans la tasse ---------- */
      gsap.set('.liquid', { clearProps: 'transform' }); gsap.set('.liquid', { yPercent: 100 });
      gsap.set(['.bean', '.slogan', '.hero-sub', '.hero-cta', '.polaroid'], { visibility: 'visible' });
      var beans = gsap.utils.toArray('.bean');
      function drop(delay) {
        // chaque grain tombe d'au-dessus de l'écran, rebondit légèrement et se pose à sa place
        return gsap.timeline({ delay: delay || 0 })
          .fromTo(beans, { yPercent: -900, autoAlpha: 0, rotation: '-=120' },
            { yPercent: 0, autoAlpha: 1, rotation: '+=120', duration: 0.75, ease: 'bounce.out', stagger: 0.16 });
      }
      var intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
      intro
        .from('.logo-stage .base', { scale: 0.85, duration: 0.9, ease: 'back.out(1.6)' }, 0.1)
        .add(drop(), 0.55)
        // le sourire « avale » les grains : petit écrasement du logo
        .to('.logo-stage .base', { scaleY: 0.94, scaleX: 1.03, duration: 0.12, transformOrigin: '50% 100%', ease: 'power2.out' }, 1.55)
        .to('.logo-stage .base', { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }, 1.67)
        // puis le sourire se remplit de café
        .fromTo('.liquid', { yPercent: 100 }, { yPercent: 22, duration: 1.2, ease: 'power2.out', onComplete: function () { document.querySelector('.coffee').classList.add('full'); } }, 1.65)
        .from('.slogan', { y: 16, autoAlpha: 0, letterSpacing: '0.6em', duration: 0.9 }, 1.2)
        .from('.hero-sub', { y: 16, autoAlpha: 0, duration: 0.7 }, 1.4)
        .from('.hero-cta .pill', { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 1.5)
        .from('.polaroid', { yPercent: 40, rotation: 0, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'back.out(1.4)' }, 1.3);

      // un clic ou un survol du logo refait tomber les grains
      var stage = document.querySelector('.logo-stage'), busy = false;
      function again() {
        if (busy) return; busy = true;
        gsap.timeline({ onComplete: function () { busy = false; } })
          .to('.liquid', { yPercent: 100, duration: 0.4, ease: 'power2.in' })
          .add(drop())
          .to('.liquid', { yPercent: 22, duration: 1, ease: 'power2.out' }, '-=0.2');
      }
      stage.addEventListener('click', again);
      if (!touch) stage.addEventListener('pointerenter', again);

      // les polaroïds flottent et suivent un peu le défilement
      gsap.to('.polaroid.p1', { y: -10, rotation: -6, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.polaroid.p2', { y: 10, rotation: 9, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      // sur téléphone, les polaroïds sont juste sous le texte : pas de décalage, sinon le texte passe dessous
      if (matchMedia('(min-width: 761px)').matches) gsap.to('.hero-content', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 } });

      /* ---------- 2. Bandeau : défile en continu, accélère un peu au défilement ---------- */
      var loop = gsap.to('.ticker-track', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
      var boost = gsap.quickTo(loop, 'timeScale', { duration: 0.6, ease: 'power2.out' });
      ScrollTrigger.create({ onUpdate: function (s) {
        boost(gsap.utils.clamp(1, 3, Math.abs(s.getVelocity()) / 400));
        clearTimeout(window.__tk); window.__tk = setTimeout(function () { boost(1); }, 150);
      } });
      ScrollTrigger.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onToggle: function (s) { loop.paused(!s.isActive); } });

      /* ---------- 3. Titres ligne par ligne, textes en fondu ---------- */
      gsap.utils.toArray('h2.reveal').forEach(function (h) {
        gsap.set(h, { opacity: 1 });
        SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.lines, { yPercent: 105, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 85%' } });
          } });
      });
      ScrollTrigger.batch('.reveal:not(h2)', { start: 'top 88%', onEnter: function (b) {
        gsap.to(b, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', overwrite: true });
      } });
      gsap.set('.reveal:not(h2)', { y: 30 });
      // au clavier : un élément qui reçoit le focus s'affiche tout de suite, même s'il n'est pas encore apparu
      document.addEventListener('focusin', function (e) {
        if (!e.target.matches || !e.target.matches(':focus-visible')) return; // seulement au clavier
        var r = e.target.closest && e.target.closest('.reveal');
        if (r && +getComputedStyle(r).opacity < 1) { gsap.killTweensOf(r); gsap.set(r, { opacity: 1, y: 0 }); }
      });

      /* ---------- 4. La carte : la feuille se pose, les lignes s'écrivent ---------- */
      gsap.from('.sig .cup', { y: 40, rotation: -20, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.signatures', start: 'top 80%' } });
      gsap.from('.paper', { rotation: -3, y: 80, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.paper', start: 'top 85%' } });
      gsap.from('.paper .item', { x: -12, opacity: 0, duration: 0.45, stagger: 0.035, ease: 'power2.out', scrollTrigger: { trigger: '.paper .cols', start: 'top 80%' } });
      gsap.from('.stamp-iced', { scale: 2.4, opacity: 0, rotation: 40, duration: 0.5, ease: 'power4.in', scrollTrigger: { trigger: '.paper', start: 'top 60%' } });

      /* ---------- 5. Le camion : le plan glisse, les photos suivent ---------- */
      gsap.fromTo('.plan', { x: 40, rotation: 3 }, { x: 0, rotation: 0, ease: 'none', scrollTrigger: { trigger: '.truck', start: 'top bottom', end: 'center center', scrub: 0.6 } });
    });

    if (!document.querySelector('.anim')) return;
  });

  /* Menu : la section en cours est mise en évidence */
  var links = [].slice.call(document.querySelectorAll('.top nav a[href^="#"]'));
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (a) { var sec = document.querySelector(a.getAttribute('href')); if (sec) map[sec.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id]; if (!a) return;
        if (en.isIntersecting) { links.forEach(function (l) { l.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* Cartes boissons sur téléphone : points indicateurs */
  var row = document.querySelector('.signatures'), dots = document.querySelectorAll('.sig-dots span');
  if (row && dots.length) {
    row.addEventListener('scroll', function () {
      var cards = row.querySelectorAll('.sig'), mid = row.scrollLeft + row.clientWidth / 2, best = 0, dist = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === best); });
    }, { passive: true });
  }

  /* Galerie : glisser à la souris sur ordinateur */
  var strip = document.querySelector('.strip');
  if (strip && !touch) {
    var down = false, sx = 0, sl = 0;
    strip.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sl = strip.scrollLeft; strip.style.scrollSnapType = 'none'; });
    addEventListener('pointerup', function () { if (!down) return; down = false; strip.style.scrollSnapType = ''; });
    strip.addEventListener('pointermove', function (e) { if (down) strip.scrollLeft = sl - (e.clientX - sx); });
  }
})();
