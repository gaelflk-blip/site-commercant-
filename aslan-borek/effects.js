/* Effets visuels modernes, discrets : barre de progression, grand texte qui glisse,
   section événements qui s'ouvre en plein écran, aperçu photo sur la carte,
   curseur personnalisé et boutons aimantés (ordinateur uniquement). */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Barre dorée qui montre où on en est dans la page */
  gsap.to('.progress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
  });

  /* Grand texte : deux lignes qui glissent en sens inverse au défilement */
  gsap.utils.toArray('.bigtype-row').forEach(function (row) {
    var dir = +row.dataset.dir || 1;
    gsap.fromTo(row, { xPercent: dir > 0 ? -30 : 0 }, {
      xPercent: dir > 0 ? 0 : -30, ease: 'none',
      scrollTrigger: { trigger: '.bigtype', start: 'top bottom', end: 'bottom top', scrub: 0.5 }
    });
  });

  /* Événements : la section part d'une carte arrondie et s'ouvre en plein écran */
  gsap.fromTo('.events', { clipPath: 'inset(6% 5% 6% 5% round 28px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
    scrollTrigger: { trigger: '.events', start: 'top 95%', end: 'top 25%', scrub: 0.4 }
  });

  /* Börek détouré : il flotte doucement et tourne pendant qu'on défile dans la carte */
  if (document.querySelector('.float-borek')) {
    gsap.to('.float-borek', { y: -14, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.from('.float-borek', { autoAlpha: 0, scale: 0.8, duration: 0.8, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.menu', start: 'top 80%' } });
    gsap.fromTo('.float-borek', { rotate: -12, xPercent: 12 }, {
      rotate: 10, xPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '.menu', start: 'top 85%', end: 'bottom 30%', scrub: 0.6 }
    });
  }
  /* Camion détouré : il « arrive » vers nous au défilement */
  if (document.querySelector('.truck-cut')) {
    gsap.fromTo('.truck-cut', { scale: 0.45, y: 60, autoAlpha: 0 }, {
      scale: 1, y: 0, autoAlpha: 1, ease: 'power2.out',
      scrollTrigger: { trigger: '.events', start: 'top 80%', end: 'center 55%', scrub: 0.6 }
    });
  }

  if (!fine) return; // la suite est réservée à la souris

  document.documentElement.classList.add('has-cursor');
  var cursor = document.querySelector('.cursor'), label = document.querySelector('.cursor-label');
  var cx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' }), cy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
  var lx = gsap.quickTo(label, 'x', { duration: 0.35, ease: 'power3' }), ly = gsap.quickTo(label, 'y', { duration: 0.35, ease: 'power3' });

  /* Aperçu photo qui suit la souris sur certains plats de la carte */
  var preview = document.querySelector('.preview'), pimg = preview.querySelector('img'), pvid = preview.querySelector('video');
  var px = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' }), py = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' });

  addEventListener('pointermove', function (e) {
    cx(e.clientX); cy(e.clientY); lx(e.clientX); ly(e.clientY); px(e.clientX + (e.clientX > innerWidth - 380 ? -200 : 200)); py(e.clientY - 30);
  }, { passive: true });

  /* Le curseur grossit sur les liens et affiche « Voir » sur les photos */
  document.querySelectorAll('a, button').forEach(function (el) {
    el.addEventListener('pointerenter', function () { gsap.to(cursor, { scale: 2.2, duration: 0.25 }); });
    el.addEventListener('pointerleave', function () { gsap.to(cursor, { scale: 1, duration: 0.25 }); });
  });
  document.querySelectorAll('.step img, .step video, .truck-photos img, .truck-photos video, .events img').forEach(function (el) {
    el.addEventListener('pointerenter', function () { gsap.to(label, { autoAlpha: 1, duration: 0.2 }); gsap.to(cursor, { scale: 0, duration: 0.2 }); });
    el.addEventListener('pointerleave', function () { gsap.to(label, { autoAlpha: 0, duration: 0.2 }); gsap.to(cursor, { scale: 1, duration: 0.2 }); });
  });

  document.querySelectorAll('.dish[data-img]').forEach(function (d) {
    d.addEventListener('pointerenter', function () {
      pimg.src = d.dataset.img;
      if (d.dataset.video) { pvid.src = d.dataset.video; pvid.hidden = false; pvid.play().catch(function () {}); }
      else { pvid.pause(); pvid.hidden = true; }
      gsap.to(preview, { autoAlpha: 1, scale: 1, rotate: -3, duration: 0.35, ease: 'back.out(1.7)' });
    });
    d.addEventListener('pointerleave', function () { gsap.to(preview, { autoAlpha: 0, scale: 0.6, rotate: 0, duration: 0.25 }); });
  });

  /* Boutons aimantés : ils suivent un peu la souris */
  document.querySelectorAll('.btn, .call').forEach(function (b) {
    var bx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3' }), by = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3' });
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      bx((e.clientX - r.left - r.width / 2) * 0.3); by((e.clientY - r.top - r.height / 2) * 0.4);
    });
    b.addEventListener('pointerleave', function () { bx(0); by(0); });
  });

  /* Photos des étapes : légère inclinaison 3D qui suit la souris */
  document.querySelectorAll('.step figure').forEach(function (f) {
    var img = f.querySelector('img, video');
    f.style.perspective = '900px';
    f.addEventListener('pointermove', function (e) {
      var r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(img, { rotateY: x * 8, rotateX: -y * 8, scale: 1.03, duration: 0.5, ease: 'power3' });
    });
    f.addEventListener('pointerleave', function () { gsap.to(img, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.6, ease: 'power3' }); });
  });
})();
