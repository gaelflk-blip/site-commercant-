/* Animations du site Aslan Börek : GSAP (ScrollTrigger, SplitText) + Lenis */
(function () {
  var root = document.documentElement;
  var top = document.querySelector('.top');

  /* Ombre sous la barre du haut dès qu'on défile (toujours actif) */
  function onScroll() { top.classList.toggle('scrolled', window.scrollY > 8); }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!window.gsap || !window.ScrollTrigger || !root.classList.contains('anim')) {
    root.classList.remove('anim');
    return;
  }
  window.__animReady = true;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- Défilement fluide (Lenis) synchronisé avec ScrollTrigger ---------- */
  var lenis = null;
  /* Sur iPhone et Android : défilement natif (plus fiable), et on ignore les changements de hauteur de la barre d'adresse */
  ScrollTrigger.config({ ignoreMobileResize: true });
  var touch = matchMedia('(pointer: coarse)').matches;
  if (window.Lenis && !touch) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70 });
      });
    });
  }

  var mm = gsap.matchMedia();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { mm.add('(prefers-reduced-motion: no-preference)', function () {

    /* ---------- 1. Ouverture : l'affiche ---------- */
    var title = new SplitText('.affiche-title span', { type: 'chars', mask: 'chars' });
    gsap.set(['.affiche-title', '.affiche-borek', '.affiche-lion', '.affiche-badge', '.affiche .star', '.affiche-tag', '.affiche-cta', '.hero-photo'], { visibility: 'visible' });
    var intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro
      .from(title.chars, { yPercent: 110, duration: 0.9, stagger: 0.04 }, 0.1)
      .from('.affiche-borek', { yPercent: 40, scale: 0.55, rotate: -18, autoAlpha: 0, duration: 1.3, ease: 'back.out(1.3)' }, 0.45)
      .from('.affiche .star', { scale: 0, rotate: -120, duration: 0.7, stagger: 0.07, ease: 'back.out(2.2)' }, 0.9)
      .from('.affiche-lion', { scale: 0, rotate: -40, duration: 0.7, ease: 'back.out(2.2)' }, 1.05)
      .from('.affiche-badge', { scale: 0, duration: 0.6, ease: 'back.out(2.2)' }, 1.15)
      .from(['.affiche-tag', '.affiche-cta .btn'], { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 1.0);

    /* Le börek flotte, puis tourne et grossit un peu quand on quitte l'affiche ; les deux mots s'écartent */
    gsap.to('.affiche-borek', { y: -12, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 });
    gsap.utils.toArray('.affiche .star').forEach(function (st, i) {
      gsap.to(st, { y: i % 2 ? 10 : -10, rotate: i % 2 ? 20 : -20, duration: 2 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
    var leave = gsap.timeline({ scrollTrigger: { trigger: '.affiche', start: 'top top', end: 'bottom top', scrub: 0.5 } });
    leave.to('.affiche-borek', { rotate: 12, scale: 1.12, yPercent: 25, ease: 'none' }, 0)
         .to('.affiche-title .l1', { xPercent: -10, ease: 'none' }, 0)
         .to('.affiche-title .l2', { xPercent: 10, ease: 'none' }, 0);

    /* Souris : léger relief entre le börek, les étoiles et le lion */
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var aff = document.querySelector('.affiche');
      var bx = gsap.quickTo('.affiche-borek', 'x', { duration: 0.8, ease: 'power3' });
      var lx = gsap.quickTo('.affiche-lion', 'x', { duration: 0.9, ease: 'power3' }), ly = gsap.quickTo('.affiche-lion', 'y', { duration: 0.9, ease: 'power3' });
      aff.addEventListener('pointermove', function (e) {
        var r = aff.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        bx(x * 40); lx(x * -18); ly(y * -14);
      });
      aff.addEventListener('pointerleave', function () { bx(0); lx(0); ly(0); });
    }

    /* La carte vidéo s'ouvre comme un volet quand on arrive dessus */
    gsap.fromTo('.hero-photo', { clipPath: 'inset(12% 6% 12% 6% round 32px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: '.hero.scrub', start: 'top 95%', end: 'top 30%', scrub: 0.4 }
    });

    /* Le motif de faïence bouge légèrement au défilement */
    gsap.utils.toArray('.tiles').forEach(function (el) {
      gsap.fromTo(el, { backgroundPositionY: '0px' }, {
        backgroundPositionY: '-120px', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- 2. Bandeau des garnitures : accélère quand on défile ---------- */
    var loop = gsap.to('.marquee-track', { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
    /* Le bandeau accélère un peu quand on défile, mais ne part jamais en arrière */
    var boost = gsap.quickTo(loop, 'timeScale', { duration: 0.6, ease: 'power2.out' });
    ScrollTrigger.create({
      onUpdate: function (self) {
        boost(gsap.utils.clamp(1, 3, Math.abs(self.getVelocity()) / 400));
        clearTimeout(window.__mq);
        window.__mq = setTimeout(function () { boost(1); }, 150);
      }
    });

    /* ---------- 3. Titres : les lignes montent une à une ---------- */
    gsap.utils.toArray('h2.reveal').forEach(function (h) {
      var split = new SplitText(h, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.set(h, { visibility: 'visible' });
      gsap.from(split.lines, {
        yPercent: 105, duration: 1, ease: 'power4.out', stagger: 0.12,
        scrollTrigger: { trigger: h, start: 'top 85%' }
      });
    });
    gsap.utils.toArray('.lead.reveal, .find.reveal, ul.reveal').forEach(function (el) {
      gsap.set(el, { visibility: 'visible' });
      gsap.from(el, { y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    /* ---------- 4. Les trois étapes : photos dévoilées dans l'ordre ---------- */
    gsap.set('.step.reveal', { visibility: 'visible' });
    var steps = gsap.timeline({ scrollTrigger: { trigger: '.steps', start: 'top 78%' } });
    gsap.utils.toArray('.step').forEach(function (step, i) {
      steps
        .fromTo(step.querySelector('img, video'), { clipPath: 'inset(100% 0 0 0)', scale: 1.15 },
          { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.1, ease: 'expo.out' }, i * 0.22)
        .from(step.querySelectorAll('figcaption, p'), { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, i * 0.22 + 0.35);
    });

    /* ---------- 5. La carte : les plats arrivent en cascade ---------- */
    gsap.set('.dish.reveal', { visibility: 'visible', autoAlpha: 0 });
    ScrollTrigger.batch('.dish', {
      start: 'top 92%',
      onEnter: function (batch) {
        gsap.fromTo(batch, { x: -24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out', overwrite: true });
      }
    });
    gsap.from('.menu h3', { scaleX: 0, transformOrigin: 'left', duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.menu-grid', start: 'top 85%' } });

    /* ---------- 6. Le camion : photos à vitesses différentes ---------- */
    gsap.set('.truck-photos.reveal', { visibility: 'visible' });
    gsap.from('.truck-photos > *', {
      y: 60, autoAlpha: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.truck-photos', start: 'top 80%' }
    });
    gsap.to('.truck-photos > :first-child', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.truck', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    /* ---------- 7. Événements : la photo s'ouvre comme le volet du camion ---------- */
    gsap.fromTo('.events img:not(.truck-cut)', { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.events', start: 'top 70%' }
    });

    return function () { title.revert(); };
  }); });

  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
