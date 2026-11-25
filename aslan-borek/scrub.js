/* Haut de page : la vidéo avance quand on défile et recule quand on remonte.
   La vidéo est découpée en images (img/scrub/), dessinées dans un canvas :
   c'est la technique la plus fluide, y compris sur iPhone. */
(function () {
  var hero = document.querySelector('.hero.scrub');
  if (!hero) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap || !window.ScrollTrigger;

  var COUNT = 90, frames = new Array(COUNT), loaded = 0;
  var canvas = hero.querySelector('.scrub-canvas'), ctx = canvas.getContext('2d', { alpha: false });
  var src = function (i) { return 'img/scrub/f' + String(i + 1).padStart(3, '0') + '.webp'; };
  var current = 0;

  var lastW = 0;
  function size() {
    var r0 = canvas.getBoundingClientRect();
    if (Math.abs(r0.width - lastW) < 2 && canvas.width) return; // la barre d'adresse de l'iPhone ne doit pas tout redessiner
    lastW = r0.width;
    // Pas plus grand que la vidéo source (1280 px) : au-delà, c'est du calcul pour rien
    var r = canvas.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 1280 / r.width, 1.5);
    canvas.width = Math.round(r.width * k); canvas.height = Math.round(r.height * k);
    drawn = -1; draw(current);
  }

  /* Dessine l'image la plus proche déjà chargée, cadrée comme object-fit: cover */
  var drawn = -1;
  function draw(i) {
    current = i;
    if (i === drawn && frames[i]) return; // même image : rien à refaire
    var img = frames[i];
    if (!img) { for (var d = 1; d < COUNT && !img; d++) img = frames[i - d] || frames[i + d]; }
    if (!img || !canvas.width) return;
    var iw = img.width, ih = img.height;
    var cw = canvas.width, ch = canvas.height, s = Math.max(cw / iw, ch / ih);
    var w = iw * s, h = ih * s;
    // sur téléphone (format portrait), on cadre un peu à droite pour garder le börek et la main
    var fx = cw < ch ? 0.58 : 0.5;
    ctx.drawImage(img, (cw - w) * fx, (ch - h) / 2, w, h);
    if (frames[i] === img) drawn = i;
  }

  function load(i) {
    return new Promise(function (ok) {
      var im = new Image(); im.decoding = 'async';
      im.onload = function () {
        // Décodage à l'avance (hors du fil principal quand c'est possible) : plus de saccade au défilement
        var done = function (bmp) { frames[i] = bmp || im; loaded++; ok(); };
        if (window.createImageBitmap) createImageBitmap(im).then(done, function () { done(); });
        else if (im.decode) im.decode().then(function () { done(); }, function () { done(); });
        else done();
      };
      im.onerror = ok; im.src = src(i);
    });
  }

  /* La première image d'abord, puis une sur quatre, puis le reste : la vidéo est utilisable très vite */
  load(0).then(function () {
    size(); canvas.classList.add('on');
    var order = [];
    for (var step = 8; step >= 1; step = step >> 1)
      for (var i = 0; i < COUNT; i += step) if (order.indexOf(i) < 0 && i) order.push(i);
    (function next(k) {
      if (k >= order.length) return;
      Promise.all(order.slice(k, k + 6).map(load)).then(function () { draw(current); next(k + 6); });
    })(0);
  });
  addEventListener('resize', size);

  /* Animations réduites sur l'appareil : pas de défilement piloté,
     mais un bouton pour lancer la vidéo quand on le souhaite */
  if (reduced) {
    var btn = document.createElement('button');
    btn.className = 'play-btn'; btn.type = 'button'; btn.textContent = '▶ Voir la vidéo';
    hero.appendChild(btn);
    btn.addEventListener('click', function () {
      btn.hidden = true;
      var t0 = performance.now();
      (function tick(now) {
        var i = Math.min(COUNT - 1, Math.floor((now - t0) / 1000 * 9));
        draw(i);
        if (i < COUNT - 1) requestAnimationFrame(tick);
        else { btn.textContent = '↺ Revoir'; btn.hidden = false; }
      })(t0);
    });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* La section reste collée en haut (position: sticky, géré par le navigateur, très stable sur iPhone)
     pendant que la vidéo avance selon la position dans le bloc .scrub-wrap */
  var state = { f: 0 }, queued = false;
  function paint() { queued = false; draw(Math.round(state.f)); }
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.scrub-wrap', start: 'top 64px', end: 'bottom bottom', scrub: 0.3,
      onUpdate: function () { if (!queued) { queued = true; requestAnimationFrame(paint); } }
    }
  });
  tl.to(state, { f: COUNT - 1, ease: 'none', duration: 1 }, 0)
    .to('.scroll-hint', { autoAlpha: 0, duration: 0.08 }, 0)
    .to('.hero .stamp', { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1 }, 0.7)
    .to('.hero-text', { y: -30, autoAlpha: 0.9, duration: 0.3 }, 0.7);
})();
