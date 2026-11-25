/* Contenus externes (Instagram, Google Maps) et consentement aux cookies.
   Rien n'est chargé chez Instagram ou Google tant que le visiteur n'a pas accepté (RGPD).
   Le choix est gardé dans le navigateur (localStorage, pas un cookie) et modifiable via « Gérer les cookies ». */
(function () {
  /* ---------- À REMPLIR ---------- */
  // Liens de publications Instagram à afficher (3 conseillés), ex. 'https://www.instagram.com/p/XXXXXXXX/'
  var INSTAGRAM_POSTS = [];
  // Marchés où trouver le camion : { nom, quand, adresse }
  var MARCHES = [];
  /* -------------------------------- */

  var KEY = 'aslan-consent';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var hasEmbeds = INSTAGRAM_POSTS.length || MARCHES.length;

  /* Instagram : section construite seulement s'il y a des publications */
  var insta = document.getElementById('instagram');
  if (insta && INSTAGRAM_POSTS.length) {
    insta.hidden = false;
    var grid = insta.querySelector('.insta-grid');
    INSTAGRAM_POSTS.forEach(function (url) {
      var bq = document.createElement('blockquote');
      bq.className = 'instagram-media'; bq.setAttribute('data-instgrm-permalink', url); bq.setAttribute('data-instgrm-version', '14');
      bq.innerHTML = '<a href="' + url + '">Voir cette publication sur Instagram</a>';
      grid.appendChild(bq);
    });
  }

  /* Marchés : liste toujours visible, carte Google seulement après accord */
  var box = document.getElementById('marches');
  if (box && MARCHES.length) {
    box.hidden = false;
    var ul = box.querySelector('ul');
    MARCHES.forEach(function (m, i) {
      var li = document.createElement('li');
      li.innerHTML = '<b>' + m.nom + '</b><span>' + m.quand + '</span><button type="button" class="map-btn" data-i="' + i + '">Voir sur la carte</button>';
      ul.appendChild(li);
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.map-btn'); if (!b) return;
      if (get() !== 'yes') { openBanner(); return; }
      showMap(+b.dataset.i);
    });
  }
  function showMap(i) {
    var frame = box.querySelector('.map-frame');
    frame.hidden = false;
    frame.innerHTML = '<iframe title="Carte : ' + MARCHES[i].nom + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(MARCHES[i].adresse) + '&output=embed"></iframe>';
  }

  function loadEmbeds() {
    if (INSTAGRAM_POSTS.length && !document.getElementById('ig-embed')) {
      var s = document.createElement('script'); s.id = 'ig-embed'; s.async = true; s.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(s);
      insta.querySelector('.insta-consent').hidden = true;
    }
    if (MARCHES.length) showMap(0);
  }

  /* Bannière */
  var banner = document.getElementById('cookie-banner');
  function openBanner() { banner.hidden = false; banner.querySelector('button').focus(); }
  function choose(v) {
    set(v); banner.hidden = true;
    if (v === 'yes') loadEmbeds(); else location.reload(); // refus après acceptation : on recharge sans les contenus externes
  }
  banner.querySelector('[data-choice="yes"]').addEventListener('click', function () { choose('yes'); });
  banner.querySelector('[data-choice="no"]').addEventListener('click', function () { var was = get(); set('no'); banner.hidden = true; if (was === 'yes') location.reload(); });
  document.querySelectorAll('[data-open-cookies]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); openBanner(); });
  });
  document.querySelectorAll('[data-accept-cookies]').forEach(function (a) {
    a.addEventListener('click', function () { choose('yes'); });
  });

  if (!hasEmbeds) return;           // aucun contenu externe configuré : pas de bannière
  if (get() === 'yes') loadEmbeds();
  else if (get() === null) openBanner();
})();
