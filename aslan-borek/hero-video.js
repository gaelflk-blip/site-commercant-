/* Haut de page : la vidéo se joue toute seule, normalement (lecteur natif du téléphone, donc fluide).
   Elle se joue une fois et s'arrête sur la dernière image (la roquette posée sur le börek).
   Le défilement ne la fait jamais reculer : elle se met juste en pause hors de l'écran et reprend où elle était.
   Téléphone : version recadrée en vertical, plus légère. */
(function () {
  var hero = document.querySelector('.hero.scrub'), v = hero && hero.querySelector('.hero-video');
  if (!v) return;
  var portrait = matchMedia('(orientation: portrait)').matches;
  v.src = portrait ? v.dataset.srcM : v.dataset.src;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var btn = null;
  function showButton(label) {
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'play-btn'; btn.type = 'button';
      btn.addEventListener('click', function () { v.currentTime = 0; tryPlay(); }); // seul le bouton « Revoir » remet au début
      hero.appendChild(btn);
    }
    btn.textContent = label; btn.hidden = false;
  }
  function tryPlay() {
    var p = v.play();
    // Seul un vrai refus de lecture automatique affiche le bouton (pas une pause pendant le chargement)
    if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') showButton('▶ Voir la vidéo'); });
  }
  v.addEventListener('playing', function () { v.classList.add('on'); if (btn) btn.hidden = true; });

  if (reduced) {
    showButton('▶ Voir la vidéo');
    v.addEventListener('ended', function () { showButton('↺ Revoir'); });
    return;
  }

  // Pause quand le haut du site n'est plus visible (économise la batterie), reprise au même endroit
  new IntersectionObserver(function (e) {
    if (e[0].isIntersecting) { if (!v.ended) tryPlay(); } else v.pause();
  }, { threshold: 0 }).observe(hero);
})();

/* Vidéos des étapes et du camion : elles se lancent quand on arrive dessus (en boucle, sans son)
   et se mettent en pause quand elles sortent de l'écran. Rien ne se charge avant d'en avoir besoin. */
(function () {
  var vids = document.querySelectorAll('.auto-video');
  if (!vids.length || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (!v.src) { v.src = v.dataset.src; }
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else if (!v.paused) v.pause();
    });
  }, { threshold: 0.25, rootMargin: '200px 0px' });
  vids.forEach(function (v) { io.observe(v); });
})();
