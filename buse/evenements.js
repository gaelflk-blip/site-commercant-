/* Formulaire « événements privés » : prépare le message, rien n'est stocké ni envoyé par le site.
   À COMPLÉTER : l'adresse e-mail de Büse (laisser vide tant qu'elle n'est pas connue). */
(function () {
  var EMAIL = '';            // ex. 'hello@buse.coffee'
  var INSTAGRAM = 'https://ig.me/m/buse.coffee';

  var form = document.getElementById('ev-form');
  if (!form) return;
  var err = document.getElementById('ev-error'), done = document.getElementById('ev-done'), via = 'email';
  var date = document.getElementById('ev-date');
  date.min = new Date().toISOString().slice(0, 10);

  // sans e-mail connu, le bouton e-mail est masqué : on passe par Instagram
  var mailBtn = form.querySelector('[data-via="email"]');
  if (!EMAIL) mailBtn.hidden = true;

  form.querySelectorAll('button[data-via]').forEach(function (b) { b.addEventListener('click', function () { via = b.dataset.via; }); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var missing = [].slice.call(form.querySelectorAll('[required]')).filter(function (f) { return !f.value.trim(); });
    if (missing.length) {
      err.textContent = 'Il manque : ' + missing.map(function (f) {
        return form.querySelector('label[for="' + f.id + '"]').firstChild.textContent.trim().toLowerCase();
      }).join(', ') + '.';
      missing[0].focus(); return;
    }
    err.textContent = '';
    var v = function (n) { return form.elements[n].value.trim(); };
    var envies = [].slice.call(form.querySelectorAll('input[name=envies]:checked')).map(function (i) { return i.value; }).join(', ') || 'À définir';
    var d = new Date(v('date') + 'T12:00').toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var txt = 'Bonjour Büse,\n\nJe souhaite un devis pour un événement privé :\n\n'
      + '• Type : ' + v('type') + '\n• Date : ' + d + '\n• Invités : ' + v('invites') + '\n• Lieu : ' + v('lieu')
      + (v('duree') ? '\n• Durée : ' + v('duree') : '') + '\n• Envies : ' + envies
      + (v('message') ? '\n\nMessage :\n' + v('message') : '')
      + '\n\n' + v('nom') + '\n' + v('contact');

    if (via === 'email' && EMAIL) {
      location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Événement privé : ' + v('type') + ', ' + d) + '&body=' + encodeURIComponent(txt);
      return;
    }
    // Instagram ne permet pas de pré-remplir un message : on le copie, puis on ouvre la conversation
    function openIg() {
      done.hidden = false;
      done.textContent = 'Votre message est copié. Collez-le dans la conversation Instagram qui vient de s\'ouvrir.';
      window.open(INSTAGRAM, '_blank', 'noopener');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(openIg, function () { fallback(); });
    else fallback();
    function fallback() {
      done.hidden = false;
      done.textContent = 'Copiez ce message, puis envoyez-le-nous sur Instagram (@buse.coffee) :\n\n' + txt;
      done.style.whiteSpace = 'pre-wrap';
    }
  });
})();
