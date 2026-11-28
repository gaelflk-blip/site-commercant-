/* Admin de Büse : voir admin/index.html. Fichier séparé pour que la page puisse interdire tout script intégré (CSP). */
(function () {
  /* ---------- Réglages ----------
     Fonctions serveur (Netlify) : /api/connexion (mot de passe + code à 6 chiffres) et /api/publier.
     Sur l'ordinateur de test : node outils/admin-local.mjs (mêmes fonctions, même sécurité). */
  var API = '/api/publier', AUTH = '/api/connexion';
  var KEY = 'buse-admin-brouillon';
  var SECTIONS = [
    { id: 'coffee', titre: 'Coffee', saison: 'toujours', aide: 'Toute l\'année' },
    { id: 'hiver', titre: 'Winter drinks', saison: 'hiver', aide: 'Carte d\'hiver' },
    { id: 'sans_cafe', titre: 'No beans', saison: 'normale', aide: 'Carte normale · sans café' },
    { id: 'specials', titre: 'Specials', saison: 'normale', aide: 'Carte normale' },
    { id: 'options', titre: 'Options', saison: 'toujours', aide: 'Suppléments', plus: true }
  ];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var publie = null, b = null; // b = brouillon en cours
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var prixTxt = function (n, plus) { return (plus ? '+' : '') + Number(n || 0).toFixed(2).replace('.', ',') + ' €'; };
  var lirePrix = function (s) { var n = parseFloat(String(s).replace(',', '.').replace(/[^\d.]/g, '')); return isFinite(n) ? Math.round(n * 100) / 100 : NaN; };

  function toast(msg, err) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 3500);
  }

  /* ---------- Chargement ---------- */
  function charger() { return fetch('../contenu.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (c) {
    publie = c;
    var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    b = saved && saved.base === JSON.stringify(c) ? saved.data : clone(c); // brouillon gardé s'il part de la version en ligne
    $('#app').hidden = false; $('#bottom').hidden = false; $('#logout').hidden = false;
    renderAll();
    if (saved && saved.base === JSON.stringify(c) && changes().length) toast('Vos modifications non publiées sont revenues.');
  }).catch(function () { $('#status').textContent = 'Erreur'; toast('Impossible de charger le contenu du site.', true); }); }

  // on n'affiche rien tant que la connexion n'est pas vérifiée par le serveur
  fetch(AUTH, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) {
    if (r.ok) charger(); else askLogin(r.status === 503 ? 'L\'admin n\'est pas encore configuré.' : '');
  }).catch(function () { askLogin('Pas de connexion internet ?'); });

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ base: JSON.stringify(publie), data: b })); } catch (e) {}
    updateStatus(); sendPreview();
  }

  /* ---------- Carte ---------- */
  function renderCarte() {
    $$('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.saison === b.saison ? 'true' : 'false'); });
    $('#saison-hint').textContent = b.saison === 'hiver'
      ? 'Le site montre : Coffee + Winter drinks + options.'
      : 'Le site montre : Coffee + No beans + Specials + options.';
    var box = $('#sections'); box.textContent = '';
    var order = SECTIONS.slice().sort(function (x, y) { return off(x) - off(y); });
    order.forEach(function (s) {
      var card = document.createElement('section'); card.className = 'card' + (off(s) ? ' off' : '');
      var h = document.createElement('div'); h.className = 'card-h';
      var t = document.createElement('h2'); t.textContent = s.titre;
      var tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = off(s) ? 'Pas affiché en ce moment' : s.aide;
      h.append(t, tag); card.appendChild(h);
      var list = b.carte[s.id] = b.carte[s.id] || [];
      var old = (publie.carte[s.id] || []);
      list.forEach(function (d, i) {
        var row = document.createElement('button'); row.type = 'button';
        var was = old.filter(function (o) { return o.nom === d.nom; })[0];
        var changed = !was || was.prix !== d.prix || (was.detail || '') !== (d.detail || '') || !!was.masque !== !!d.masque;
        row.className = 'row' + (d.masque ? ' masque' : '') + (changed ? ' changed' : '');
        var n = document.createElement('span'); n.className = 'n';
        var nb = document.createElement('b'); nb.textContent = d.nom || 'Sans nom';
        n.appendChild(nb);
        var sm = document.createElement('small');
        sm.textContent = d.masque ? 'Indisponible : caché sur le site' : (d.detail || (s.id === 'options' && d.en_hiver === false ? 'Pas avec la carte d\'hiver' : ''));
        if (sm.textContent) n.appendChild(sm);
        var p = document.createElement('span'); p.className = 'p'; p.textContent = prixTxt(d.prix, s.plus);
        var ch = document.createElement('span'); ch.className = 'chev'; ch.setAttribute('aria-hidden', 'true'); ch.textContent = '›';
        row.append(n, p, ch);
        row.setAttribute('aria-label', 'Modifier ' + (d.nom || 'la boisson') + ', ' + prixTxt(d.prix, s.plus));
        row.addEventListener('click', function () { openEdit(s, i); });
        card.appendChild(row);
      });
      var add = document.createElement('button'); add.type = 'button'; add.className = 'add';
      add.textContent = '+ Ajouter ' + (s.plus ? 'une option' : 'une boisson');
      add.addEventListener('click', function () { list.push({ nom: '', prix: 0, detail: '' }); if (s.plus) list[list.length - 1].en_hiver = true; openEdit(s, list.length - 1, true); });
      card.appendChild(add);
      box.appendChild(card);
    });
  }
  function off(s) { return s.saison !== 'toujours' && s.saison !== b.saison ? 1 : 0; }
  $$('.seg button').forEach(function (x) { x.addEventListener('click', function () { b.saison = x.dataset.saison; renderCarte(); save(); }); });

  /* fenêtre « Modifier » */
  var cur = null, dlg = $('#edit');
  function openEdit(s, i, isNew) {
    cur = { s: s, i: i, isNew: !!isNew };
    var d = b.carte[s.id][i];
    $('#edit-title').textContent = isNew ? (s.plus ? 'Nouvelle option' : 'Nouvelle boisson') : 'Modifier ' + d.nom;
    $('#e-nom').value = d.nom; $('#e-prix').value = Number(d.prix || 0).toFixed(2).replace('.', ',');
    $('#e-prix-l').textContent = s.plus ? 'Supplément (€)' : 'Prix (€)';
    $('#e-detail').value = d.detail || ''; $('#e-dispo').checked = !d.masque;
    $('#e-hiver-w').hidden = !s.plus; $('#e-hiver').checked = d.en_hiver !== false;
    $('#e-prix-err').textContent = ''; $('#e-prix').removeAttribute('aria-invalid');
    $('[data-move="-1"]', dlg).disabled = i === 0; $('[data-move="1"]', dlg).disabled = i === b.carte[s.id].length - 1;
    dlg.showModal();
    if (isNew) $('#e-nom').focus();
  }
  $$('[data-step]', dlg).forEach(function (x) { x.addEventListener('click', function () {
    var n = lirePrix($('#e-prix').value); if (!isFinite(n)) n = 0;
    n = Math.max(0, Math.round((n + parseFloat(x.dataset.step)) * 100) / 100);
    $('#e-prix').value = n.toFixed(2).replace('.', ',');
  }); });
  function applyEdit() {
    var d = b.carte[cur.s.id][cur.i], n = lirePrix($('#e-prix').value), nom = $('#e-nom').value.trim();
    if (!nom) { $('#e-nom').focus(); $('#e-nom').setAttribute('aria-invalid', 'true'); return false; }
    if (!isFinite(n) || n < 0 || n > 100) { $('#e-prix-err').textContent = 'Entrez un prix, par exemple 4,50.'; $('#e-prix').setAttribute('aria-invalid', 'true'); $('#e-prix').focus(); return false; }
    d.nom = nom; d.prix = n; d.detail = $('#e-detail').value.trim();
    if ($('#e-dispo').checked) delete d.masque; else d.masque = true;
    if (cur.s.plus) d.en_hiver = $('#e-hiver').checked;
    return true;
  }
  $('#edit-form').addEventListener('submit', function (e) { e.preventDefault(); if (applyEdit()) { dlg.close(); renderCarte(); save(); } });
  $$('[data-move]', dlg).forEach(function (x) { x.addEventListener('click', function () {
    if (!applyEdit()) return;
    var l = b.carte[cur.s.id], j = cur.i + Number(x.dataset.move); if (j < 0 || j >= l.length) return;
    l.splice(j, 0, l.splice(cur.i, 1)[0]); dlg.close(); renderCarte(); save(); openEdit(cur.s, j);
  }); });
  $('#e-del').addEventListener('click', function () {
    var d = b.carte[cur.s.id][cur.i];
    if (!cur.isNew && !confirm('Supprimer « ' + d.nom + ' » de la carte ?')) return;
    b.carte[cur.s.id].splice(cur.i, 1); cur.isNew = false; dlg.close(); renderCarte(); save();
  });
  // fermer une nouvelle boisson vide sans l'enregistrer
  dlg.addEventListener('close', function () {
    if (!cur) return; var l = b.carte[cur.s.id], d = l[cur.i];
    if (cur.isNew && d && !d.nom) { l.splice(cur.i, 1); renderCarte(); save(); }
    cur.isNew = false;
  });
  $$('[data-close]').forEach(function (x) { x.addEventListener('click', function () { x.closest('dialog').close(); }); });

  /* ---------- Annonce ---------- */
  function renderAnnonce() {
    b.annonce = b.annonce || { afficher: false, texte: '' };
    $('#an-on').checked = !!b.annonce.afficher; $('#an-txt').value = b.annonce.texte || ''; annoncePrev();
  }
  function annoncePrev() {
    var t = $('#an-txt').value, on = $('#an-on').checked && t.trim();
    $('#an-count').textContent = t.length + ' / 90';
    var p = $('#an-prev'); p.textContent = on ? t : 'Pas d\'annonce affichée'; p.className = on ? '' : 'vide';
  }
  $('#an-on').addEventListener('change', function () { b.annonce.afficher = this.checked; annoncePrev(); save(); });
  $('#an-txt').addEventListener('input', function () { b.annonce.texte = this.value; annoncePrev(); save(); });
  $$('#p-annonce .chips button').forEach(function (x) { x.addEventListener('click', function () {
    b.annonce.texte = x.textContent; b.annonce.afficher = true; renderAnnonce(); save();
  }); });

  /* ---------- Instagram et marchés ---------- */
  var IG = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[\w-]+/;
  function renderLiens() {
    var box = $('#insta'); box.textContent = '';
    b.instagram = b.instagram || []; b.marches = b.marches || [];
    b.instagram.forEach(function (x, i) {
      var w = document.createElement('div'); w.className = 'item-edit';
      var f = field('Lien de la publication ' + (i + 1), x.lien || '', 'https://www.instagram.com/p/…', function (v, inp, err) {
        x.lien = v.trim(); var ok = !x.lien || IG.test(x.lien);
        err.textContent = ok ? '' : 'Collez un lien de publication Instagram (il commence par https://www.instagram.com/p/).';
        inp.setAttribute('aria-invalid', ok ? 'false' : 'true'); save();
      }, 'url');
      w.append(del(function () { b.instagram.splice(i, 1); renderLiens(); save(); }, 'Retirer la publication ' + (i + 1)), f);
      box.appendChild(w);
    });
    var mb = $('#marches'); mb.textContent = '';
    b.marches.forEach(function (m, i) {
      var w = document.createElement('div'); w.className = 'item-edit';
      w.append(del(function () { b.marches.splice(i, 1); renderLiens(); save(); }, 'Retirer ce marché'),
        field('Nom', m.nom || '', 'Ex. : Marché du Châtelain', function (v) { m.nom = v; save(); }),
        field('Quand', m.quand || '', 'Ex. : Mercredi 14 h – 20 h', function (v) { m.quand = v; save(); }),
        field('Adresse (pour la carte)', m.adresse || '', 'Ex. : Place du Châtelain, 1050 Ixelles', function (v) { m.adresse = v; save(); }));
      mb.appendChild(w);
    });
  }
  function field(label, val, ph, on, type) {
    var l = document.createElement('label'); l.className = 'field';
    var s = document.createElement('span'); s.textContent = label;
    var i = document.createElement('input'); i.value = val; i.placeholder = ph; if (type) { i.type = type; i.inputMode = 'url'; }
    var err = document.createElement('p'); err.className = 'err'; err.id = 'err' + Math.random().toString(36).slice(2); i.setAttribute('aria-describedby', err.id);
    i.addEventListener('input', function () { on(i.value, i, err); });
    l.append(s, i, err); return l;
  }
  function del(fn, label) { var x = document.createElement('button'); x.type = 'button'; x.className = 'del'; x.textContent = '✕'; x.setAttribute('aria-label', label); x.addEventListener('click', fn); return x; }
  $('#add-insta').addEventListener('click', function () { b.instagram.push({ lien: '' }); renderLiens(); save(); var l = $$('#insta input'); l[l.length - 1].focus(); });
  $('#add-marche').addEventListener('click', function () { b.marches.push({ nom: '', quand: '', adresse: '' }); renderLiens(); save(); var l = $$('#marches .item-edit'); $('input', l[l.length - 1]).focus(); });

  /* ---------- Aperçu en direct ---------- */
  var frame = $('#preview'), frameReady = false;
  function sendPreview() { if (frameReady) frame.contentWindow.postMessage({ type: 'buse-apercu', contenu: propre() }, location.origin); }
  frame.addEventListener('load', function () { frameReady = frame.src.indexOf('apercu') > -1; setTimeout(sendPreview, 400); });
  $$('.prev-jump button').forEach(function (x) { x.addEventListener('click', function () {
    var d = frame.contentDocument; if (!d) return;
    var w = frame.contentWindow, el = x.dataset.go === 'carte' ? d.querySelector('.paper') : d.getElementById(x.dataset.go);
    // on fait défiler seulement l'aperçu, pas la page admin
    w.scrollTo(0, x.dataset.go === 'top' || !el ? 0 : el.getBoundingClientRect().top + w.pageYOffset - 80);
  }); });

  /* ---------- Onglets ---------- */
  $$('.tabs [role=tab]').forEach(function (t) { t.addEventListener('click', function () {
    $$('.tabs [role=tab]').forEach(function (o) { o.setAttribute('aria-selected', o === t ? 'true' : 'false'); $('#' + o.getAttribute('aria-controls')).hidden = o !== t; });
    scrollTo(0, 0);
    if (t.id === 't-apercu' && frame.src === 'about:blank') frame.src = '../?apercu=1';
    else if (t.id === 't-apercu') sendPreview();
  }); });

  /* ---------- Modifications et publication ---------- */
  function propre() { // contenu à publier : sans lignes vides
    var c = clone(b);
    Object.keys(c.carte).forEach(function (k) { c.carte[k] = c.carte[k].filter(function (d) { return d.nom; }); });
    c.instagram = (c.instagram || []).filter(function (x) { return x.lien && IG.test(x.lien); });
    c.marches = (c.marches || []).filter(function (m) { return m.nom; });
    return c;
  }
  function changes() {
    var a = publie, c = propre(), out = [];
    if (a.saison !== c.saison) out.push(['Carte affichée', a.saison === 'hiver' ? 'Hiver' : 'Normale', c.saison === 'hiver' ? 'Hiver' : 'Normale']);
    SECTIONS.forEach(function (s) {
      var o = a.carte[s.id] || [], n = c.carte[s.id] || [];
      n.forEach(function (d) {
        var w = o.filter(function (x) { return x.nom === d.nom; })[0];
        if (!w) out.push(['Ajouté dans ' + s.titre, null, d.nom + ' · ' + prixTxt(d.prix, s.plus)]);
        else {
          if (w.prix !== d.prix) out.push([d.nom, prixTxt(w.prix, s.plus), prixTxt(d.prix, s.plus)]);
          if ((w.detail || '') !== (d.detail || '')) out.push([d.nom + ' (détail)', w.detail || 'vide', d.detail || 'vide']);
          if (!!w.masque !== !!d.masque) out.push([d.nom, null, d.masque ? 'indisponible' : 'de nouveau disponible']);
          if (s.plus && (w.en_hiver !== false) !== (d.en_hiver !== false)) out.push([d.nom, null, d.en_hiver === false ? 'plus avec la carte d\'hiver' : 'aussi avec la carte d\'hiver']);
        }
      });
      o.forEach(function (d) { if (!n.some(function (x) { return x.nom === d.nom; })) out.push(['Retiré de ' + s.titre, null, d.nom]); });
      var on = o.map(function (d) { return d.nom; }).filter(function (x) { return n.some(function (y) { return y.nom === x; }); }).join('|');
      var nn = n.map(function (d) { return d.nom; }).filter(function (x) { return o.some(function (y) { return y.nom === x; }); }).join('|');
      if (on !== nn) out.push([s.titre, null, 'nouvel ordre']);
    });
    var ao = a.annonce || {}, an = c.annonce || {};
    var vo = ao.afficher && ao.texte ? ao.texte : '', vn = an.afficher && an.texte ? an.texte : '';
    if (vo !== vn) out.push(['Annonce', vo || 'aucune', vn || 'aucune']);
    if (JSON.stringify(a.instagram || []) !== JSON.stringify(c.instagram)) out.push(['Instagram', null, c.instagram.length + ' publication(s)']);
    if (JSON.stringify(a.marches || []) !== JSON.stringify(c.marches)) out.push(['Marchés', null, c.marches.length ? c.marches.map(function (m) { return m.nom; }).join(', ') : 'aucun']);
    return out;
  }
  function updateStatus() {
    var n = changes().length, s = $('#status');
    s.textContent = n ? n + ' modif' + (n > 1 ? 's' : '') + ' à publier' : 'Tout est en ligne ✓';
    s.className = 'status ' + (n ? 'todo' : 'ok');
    $('#pub').hidden = !n; $('#go').textContent = 'Publier (' + n + ')';
  }
  function renderAll() { renderCarte(); renderAnnonce(); renderLiens(); updateStatus(); }

  $('#undo').addEventListener('click', function () {
    if (!confirm('Annuler toutes les modifications non publiées ?')) return;
    b = clone(publie); try { localStorage.removeItem(KEY); } catch (e) {} renderAll(); sendPreview(); toast('Modifications annulées.');
  });
  $('#go').addEventListener('click', function () {
    var ul = $('#diff'); ul.textContent = '';
    changes().forEach(function (c) {
      var li = document.createElement('li'); var t = document.createElement('b'); t.textContent = c[0] + ' : '; li.appendChild(t);
      if (c[1] !== null) { var o = document.createElement('span'); o.className = 'old'; o.textContent = c[1]; li.append(o, document.createTextNode(' → ')); }
      li.appendChild(document.createTextNode(c[2])); ul.appendChild(li);
    });
    $('#check').showModal();
  });

  $('#publish').addEventListener('click', function () {
    var btn = this; btn.disabled = true; btn.textContent = 'Publication…';
    fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contenu: propre() }) })
      .then(function (r) {
        if (r.status === 401) { $('#check').close(); askLogin('Session terminée : reconnectez-vous. Vos modifications sont gardées.'); throw new Error('auth'); }
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.erreur || 'erreur'); });
        return r.json();
      })
      .then(function () {
        publie = propre(); b = clone(publie); try { localStorage.removeItem(KEY); } catch (e) {}
        $('#check').close(); renderAll(); toast('Publié ! Le site est à jour d\'ici une minute.');
      })
      .catch(function (e) { if (e.message !== 'auth') $('#check').close(); if (e.message !== 'auth') toast((/refusé/.test(e.message) ? e.message + '. ' : 'La publication n\'a pas marché. ') + 'Vos modifications sont gardées.', true); })
      .then(function () { btn.disabled = false; btn.textContent = 'Publier maintenant'; });
  });

  /* ---------- Connexion : mot de passe + code à 6 chiffres, vérifiés par le serveur ---------- */
  function askLogin(msg) {
    $('#login').hidden = false; $('#app').hidden = true; $('#bottom').hidden = true;
    $('#logout').hidden = true;
    $('#login-err').textContent = msg || ''; $('#status').textContent = 'Connexion'; $('#status').className = 'status';
    $('#pw').focus();
  }
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('#login-form .btn'), err = $('#login-err'), code = $('#code').value.replace(/\D/g, '');
    if (!$('#pw').value || code.length !== 6) { err.textContent = 'Entrez le mot de passe et le code à 6 chiffres.'; return; }
    btn.disabled = true; btn.textContent = 'Vérification…'; err.textContent = '';
    fetch(AUTH, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motdepasse: $('#pw').value, code: code }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok) { err.textContent = x.d.erreur || 'Connexion refusée.'; $('#code').value = ''; $('#code').focus(); return; }
        $('#pw').value = ''; $('#code').value = '';
        $('#login').hidden = true;
        $('#logout').hidden = false;
        if (publie) { $('#app').hidden = false; $('#bottom').hidden = false; updateStatus(); toast('Connecté. Vous pouvez publier.'); }
        else charger();
      })
      .catch(function () { err.textContent = 'Pas de connexion internet ?'; })
      .then(function () { btn.disabled = false; btn.textContent = 'Se connecter'; });
  });
  $('#logout').addEventListener('click', function () {
    fetch(AUTH, { method: 'DELETE', credentials: 'same-origin' }).then(function () { location.reload(); });
  });
})();
