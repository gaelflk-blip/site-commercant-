/* Haut de page : la vidéo se joue toute seule, normalement (lecteur natif du téléphone, donc fluide).
   Elle s'arrête sur la dernière image (la roquette posée sur le börek) et se rejoue quand on revient en haut.
   Téléphone : version recadrée en vertical, plus légère. */
(function () {
  var hero = document.querySelector('.hero.scrub'), v = hero && hero.querySelector('.hero-video');
  if (!v) return;
  var portrait = matchMedia('(orientation: portrait)').matches;
  v.src = portrait ? v.dataset.srcM : v.dataset.src;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function play() {
    v.currentTime = 0;
    var p = v.play();
    if (p && p.catch) p.catch(function () { showButton('▶ Voir la vidéo'); });
  }
  v.addEventListener('playing', function () { v.classList.add('on'); btn && (btn.hidden = true); });

  var btn = null;
  function showButton(label) {
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'play-btn'; btn.type = 'button';
      btn.addEventListener('click', play);
      hero.appendChild(btn);
    }
    btn.textContent = label; btn.hidden = false;
  }

  if (reduced) {
    // L'appareil demande moins d'animations : la vidéo ne démarre que si on appuie
    showButton('▶ Voir la vidéo');
    v.addEventListener('ended', function () { showButton('↺ Revoir'); });
    return;
  }

  // Lecture automatique, puis rejouée quand on revient en haut après être descendu
  var wasOut = false;
  new IntersectionObserver(function (e) {
    if (e[0].isIntersecting) { if (wasOut || v.currentTime === 0) play(); wasOut = false; }
    else { wasOut = true; v.pause(); }
  }, { threshold: 0.35 }).observe(hero);
})();
