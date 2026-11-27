/* Formulaire « événements privés » : prépare le message, rien n'est stocké ni envoyé par le site.
   À COMPLÉTER : l'adresse e-mail de Büse (laisser vide tant qu'elle n'est pas connue). */
(function () {
  var EMAIL = '';            // ex. 'hello@buse.coffee'
  var INSTAGRAM = 'https://ig.me/m/buse.coffee';

  var form = document.getElementById('ev-form');
  if (!form) return;
  var err = document.getElementById('ev-error'), done = document.getElementById('ev-done'), via = 'email';
  var date = document.getElementById('ev-date');
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  date.min = today.toISOString().slice(0, 10);

  // sans e-mail connu, le bouton e-mail est masqué : on passe par Instagram
  var mailBtn = form.querySelector('[data-via="email"]');
  if (!EMAIL) mailBtn.hidden = true;
  form.querySelectorAll('button[data-via]').forEach(function (b) { b.addEventListener('click', function () { via = b.dataset.via; }); });

  /* Les occasions préremplissent le type d'événement */
  var type = document.getElementById('ev-type');
  document.querySelectorAll('.occasions [data-type]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.occasions [data-type]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      type.value = b.dataset.type; clearError(type);
      type.focus({ preventScroll: true });
      form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  });
  type.addEventListener('change', function () {
    document.querySelectorAll('.occasions [data-type]').forEach(function (o) { o.setAttribute('aria-pressed', o.dataset.type === type.value ? 'true' : 'false'); });
  });

  /* Erreurs : un message sous chaque champ, lu par les lecteurs d'écran */
  function setError(f, msg) {
    f.setAttribute('aria-invalid', 'true');
    var id = f.id + '-err', p = document.getElementById(id);
    if (!p) { p = document.createElement('p'); p.id = id; p.className = 'field-error'; f.parentNode.appendChild(p); }
    p.textContent = msg;
    f.setAttribute('aria-describedby', id);
  }
  function clearError(f) {
    f.removeAttribute('aria-invalid');
    var p = document.getElementById(f.id + '-err'); if (p) p.remove();
    f.removeAttribute('aria-describedby');
  }
  form.querySelectorAll('input, select, textarea').forEach(function (f) {
    f.addEventListener('input', function () { if (f.getAttribute('aria-invalid')) clearError(f); });
  });

  function check() {
    var problems = [];
    var v = function (id) { return document.getElementById(id); };
    function need(f, msg, ok) { if (!ok) { setError(f, msg); problems.push(f); } else clearError(f); }
    need(v('ev-type'), 'Choisissez le type d\'événement.', !!v('ev-type').value);
    var d = v('ev-date').value;
    need(v('ev-date'), d ? 'Choisissez une date à venir.' : 'Indiquez la date.', !!d && d >= date.min);
    var n = parseInt(v('ev-invites').value, 10);
    need(v('ev-invites'), v('ev-invites').value ? 'À partir de 10 invités.' : 'Indiquez le nombre d\'invités.', n >= 10);
    need(v('ev-lieu'), 'Indiquez la commune.', !!v('ev-lieu').value.trim());
    need(v('ev-nom'), 'Indiquez votre nom.', !!v('ev-nom').value.trim());
    var c = v('ev-contact').value.trim();
    var okContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || c.replace(/[^\d]/g, '').length >= 8;
    need(v('ev-contact'), c ? 'Entrez un e-mail ou un numéro de téléphone valide.' : 'Indiquez un téléphone ou un e-mail.', okContact);
    return problems;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var problems = check();
    if (problems.length) {
      err.textContent = problems.length === 1 ? 'Un champ est à corriger.' : problems.length + ' champs sont à corriger.';
      problems[0].focus(); return;
    }
    err.textContent = '';
    var val = function (n) { return form.elements[n].value.trim(); };
    var envies = [].slice.call(form.querySelectorAll('input[name=envies]:checked')).map(function (i) { return i.value; }).join(', ') || 'À définir';
    var d = new Date(val('date') + 'T12:00').toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var txt = 'Bonjour Büse,\n\nJe souhaite un devis pour un événement privé :\n\n'
      + '• Type : ' + val('type') + '\n• Date : ' + d + '\n• Invités : ' + val('invites') + '\n• Lieu : ' + val('lieu')
      + (val('duree') ? '\n• Durée : ' + val('duree') : '') + '\n• Envies : ' + envies
      + (val('message') ? '\n\nMessage :\n' + val('message') : '')
      + '\n\n' + val('nom') + '\n' + val('contact');

    if (via === 'email' && EMAIL) {
      location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Événement privé : ' + val('type') + ', ' + d) + '&body=' + encodeURIComponent(txt);
      return;
    }
    // Instagram ne permet pas de préremplir un message : on ouvre la conversation tout de suite
    // (pendant le clic, pour ne pas être bloqué par Safari), puis on copie le message.
    var win = window.open(INSTAGRAM, '_blank', 'noopener');
    function show(copied) {
      done.hidden = false;
      done.textContent = '';
      var p = document.createElement('p');
      p.textContent = copied
        ? 'Votre message est copié. Collez-le dans la conversation Instagram avec Büse.'
        : 'Copiez ce message, puis envoyez-le à Büse sur Instagram :';
      done.appendChild(p);
      if (!copied) { var pre = document.createElement('p'); pre.style.whiteSpace = 'pre-wrap'; pre.style.marginTop = '10px'; pre.textContent = txt; done.appendChild(pre); }
      var a = document.createElement('a'); a.href = INSTAGRAM; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = win ? 'Rouvrir la conversation Instagram' : 'Ouvrir la conversation Instagram';
      var pa = document.createElement('p'); pa.style.marginTop = '10px'; pa.appendChild(a); done.appendChild(pa);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { show(true); }, function () { show(false); });
    else show(false);
  });
})();
