/* Vidéos du site : lecture native (fluide sur iPhone), chargées seulement quand on en a besoin.
   - Grande vidéo (roquette) : se joue une fois, s'arrête sur la dernière image, ne recule jamais.
   - Étapes et camion : en boucle, une seule à la fois, uniquement quand elles sont bien visibles.
   - Animations réduites ou lecture automatique bloquée (mode Économie d'énergie) : on appuie pour lancer.
   - Barre « Appeler » sur téléphone : apparaît seulement après l'affiche, pour ne pas cacher ses boutons. */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var portrait = matchMedia('(orientation: portrait)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Barre d'appel mobile ---------- */
  var bar = document.querySelector('.mobile-call'), aff = document.querySelector('.affiche');
  if (bar) {
    if (aff && hasIO) new IntersectionObserver(function (e) { bar.classList.toggle('show', !e[0].isIntersecting); }).observe(aff);
    else bar.classList.add('show');
  }

  function srcOf(v) { return v.classList.contains('hero-video') ? (portrait ? v.dataset.srcM : v.dataset.src) : v.dataset.src; }
  function load(v) { if (!v.getAttribute('src')) v.src = srcOf(v); }
  function tryPlay(v, onBlocked) {
    load(v);
    var p = v.play();
    if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError' && onBlocked) onBlocked(); });
  }

  /* ---------- Grande vidéo ---------- */
  var heroBox = document.querySelector('.hero.scrub'), hero = heroBox && heroBox.querySelector('.hero-video');
  var btn = null;
  function showButton(label) {
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'play-btn'; btn.type = 'button';
      btn.addEventListener('click', function () { hero.currentTime = 0; tryPlay(hero); });
      heroBox.appendChild(btn);
    }
    btn.textContent = label; btn.hidden = false;
  }
  if (hero) {
    hero.addEventListener('playing', function () { hero.classList.add('on'); if (btn) btn.hidden = true; });
    if (reduced) {
      showButton('▶ Voir la vidéo');
      hero.addEventListener('ended', function () { showButton('↺ Revoir'); });
    } else if (hasIO) {
      // on prépare la vidéo un peu avant qu'elle arrive à l'écran, on la lance quand elle est visible
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) load(hero); }, { rootMargin: '300px 0px' }).observe(heroBox);
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (!hero.ended) tryPlay(hero, function () { showButton('▶ Voir la vidéo'); }); }
        else hero.pause();
      }, { threshold: 0.3 }).observe(heroBox);
    }
  }

  /* ---------- Étapes et camion ---------- */
  var vids = Array.prototype.slice.call(document.querySelectorAll('.auto-video'));
  vids.forEach(function (v) {
    // un appui lance ou met en pause (utile en animations réduites et en mode Économie d'énergie)
    v.addEventListener('click', function () { if (v.paused) tryPlay(v); else v.pause(); });
  });
  if (!reduced && hasIO && vids.length) {
    var ratios = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0); });
      // une seule vidéo à la fois : la plus visible
      var best = null, max = 0.5;
      ratios.forEach(function (r, v) { if (r >= max) { max = r; best = v; } });
      vids.forEach(function (v) { if (v === best) tryPlay(v); else if (!v.paused) v.pause(); });
    }, { threshold: [0, 0.5, 0.75, 1] });
    vids.forEach(function (v) { io.observe(v); });

    // lecture automatique refusée : le premier contact avec l'écran relance la vidéo visible
    var kick = function () {
      if (hero && hero.paused && !hero.ended && heroBox.getBoundingClientRect().top < innerHeight && heroBox.getBoundingClientRect().bottom > 0) tryPlay(hero);
      var best = null, max = 0.5;
      ratios.forEach(function (r, v) { if (r >= max) { max = r; best = v; } });
      if (best && best.paused) tryPlay(best);
    };
    ['touchend', 'click', 'keydown'].forEach(function (t) { addEventListener(t, kick, { passive: true }); });
  }
})();
