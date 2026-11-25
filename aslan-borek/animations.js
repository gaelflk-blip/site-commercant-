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
  if (window.Lenis) {
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

    /* ---------- 1. Ouverture : le moment fort ---------- */
    var title = new SplitText('.hero h1 .o > span', { type: 'chars', mask: 'chars' });
    gsap.set(['.hero h1', '.hero-text p', '.hero .actions', '.stamp', '.hero-photo'], { visibility: 'visible' });

    var intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro
      .fromTo('.hero-photo', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'expo.inOut' }, 0)
            .from(title.chars, { yPercent: 110, duration: 0.9, stagger: 0.045 }, 0.25)
      .from('.hero-text p', { y: 24, autoAlpha: 0, duration: 0.8 }, 0.8)
      .from('.hero .actions .btn', { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, 0.95)
      .from('.stamp', { scale: 0.4, rotate: -25, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.2)' }, 1.3);

    /* Le motif de faïence bouge légèrement au défilement */
    gsap.utils.toArray('.tiles').forEach(function (el) {
      gsap.fromTo(el, { backgroundPositionY: '0px' }, {
        backgroundPositionY: '-120px', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- 2. Bandeau des garnitures : accélère quand on défile ---------- */
    var loop = gsap.to('.marquee-track', { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
    var boost = gsap.quickTo(loop, 'timeScale', { duration: 0.6, ease: 'power2.out' });
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity() / 250;
        boost(gsap.utils.clamp(-6, 6, v === 0 ? 1 : (self.direction * Math.max(1, Math.abs(v)))));
        clearTimeout(window.__mq);
        window.__mq = setTimeout(function () { boost(self.direction < 0 ? -1 : 1); }, 150);
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
        .fromTo(step.querySelector('img'), { clipPath: 'inset(100% 0 0 0)', scale: 1.15 },
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
    gsap.from('.truck-photos img', {
      y: 60, autoAlpha: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.truck-photos', start: 'top 80%' }
    });
    gsap.to('.truck-photos img:first-child', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.truck', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    /* ---------- 7. Événements : la photo s'ouvre comme le volet du camion ---------- */
    gsap.fromTo('.events img', { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.events', start: 'top 70%' }
    });

    return function () { title.revert(); };
  }); });

  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
