/* Contenus externes (Instagram, Google Maps) et consentement aux cookies.
   Rien n'est chargé chez Instagram ou Google tant que le visiteur n'a pas accepté (RGPD).
   Le choix est gardé dans le navigateur (localStorage, pas un cookie) et modifiable via « Gérer les cookies ».
   Sans publication ni marché renseignés ci-dessous : aucune bannière, le site reste sans cookie. */
(function () {
  /* ---------- À REMPLIR ---------- */
  // Liens de publications Instagram de @buse.coffee (3 conseillés), ex. 'https://www.instagram.com/p/XXXXXXXX/'
  var INSTAGRAM_POSTS = [];
  // Marchés où trouver le camion : { nom: 'Marché de …', quand: 'Samedi 8 h – 13 h', adresse: 'Place …, 1050 Ixelles' }
  var MARCHES = [];
  /* -------------------------------- */

  var KEY = 'buse-consent';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var hasEmbeds = INSTAGRAM_POSTS.length || MARCHES.length;

  // pied de page : « aucun cookie » ou « Gérer les cookies »
  document.querySelectorAll('[data-no-cookie]').forEach(function (e) { e.hidden = !!hasEmbeds; });
  document.querySelectorAll('[data-open-cookies]').forEach(function (e) { e.hidden = !hasEmbeds; });

  /* Instagram : section construite seulement s'il y a des publications */
  var insta = document.getElementById('instagram');
  if (insta && INSTAGRAM_POSTS.length) {
    insta.hidden = false;
    var grid = insta.querySelector('.insta-grid');
    INSTAGRAM_POSTS.forEach(function (url) {
      var bq = document.createElement('blockquote');
      bq.className = 'instagram-media'; bq.setAttribute('data-instgrm-permalink', url); bq.setAttribute('data-instgrm-version', '14');
      var a = document.createElement('a'); a.href = url; a.textContent = 'Voir cette publication sur Instagram';
      bq.appendChild(a); grid.appendChild(bq);
    });
  }

  /* Marchés : liste toujours visible, carte Google seulement après accord */
  var box = document.getElementById('marches');
  if (box && MARCHES.length) {
    box.hidden = false;
    var ul = box.querySelector('ul');
    MARCHES.forEach(function (m, i) {
      var li = document.createElement('li');
      var b = document.createElement('b'); b.textContent = m.nom;
      var s = document.createElement('span'); s.textContent = m.quand;
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'map-btn'; btn.dataset.i = i; btn.textContent = 'Voir sur la carte';
      li.append(b, s, btn); ul.appendChild(li);
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.map-btn'); if (!b) return;
      if (get() !== 'yes') { openBanner(true); return; }
      showMap(+b.dataset.i);
    });
  }
  function showMap(i) {
    var frame = box.querySelector('.map-frame');
    frame.hidden = false; frame.textContent = '';
    var f = document.createElement('iframe');
    f.title = 'Carte : ' + MARCHES[i].nom; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(MARCHES[i].adresse) + '&output=embed';
    frame.appendChild(f);
  }

  function loadEmbeds() {
    if (INSTAGRAM_POSTS.length && !document.getElementById('ig-embed')) {
      var s = document.createElement('script'); s.id = 'ig-embed'; s.async = true; s.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(s);
      insta.querySelector('.insta-consent').hidden = true;
    }
    if (MARCHES.length) showMap(0);
  }

  /* Bannière : Accepter et Refuser ont la même taille */
  var banner = document.getElementById('cookie-banner');
  function openBanner(focus) { banner.hidden = false; if (focus) banner.querySelector('button').focus({ preventScroll: true }); }
  banner.querySelector('[data-choice="yes"]').addEventListener('click', function () { set('yes'); banner.hidden = true; loadEmbeds(); });
  banner.querySelector('[data-choice="no"]').addEventListener('click', function () {
    var was = get(); set('no'); banner.hidden = true;
    if (was === 'yes') location.reload(); // refus après acceptation : on recharge sans les contenus externes
  });
  document.querySelectorAll('[data-open-cookies]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); openBanner(true); });
  });
  document.querySelectorAll('[data-accept-cookies]').forEach(function (a) {
    a.addEventListener('click', function () { set('yes'); banner.hidden = true; loadEmbeds(); });
  });

  if (!hasEmbeds) return;
  if (get() === 'yes') loadEmbeds();
  else if (get() === null) openBanner();
})();
