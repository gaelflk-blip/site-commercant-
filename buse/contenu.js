/* Contenu modifiable par Büse depuis l'admin (buse/admin/) : contenu.json.
   La page contient déjà une copie de la carte (affichée si ce fichier ne charge pas) ;
   ce script la remplace par la version à jour : saison, carte, prix, annonce, marchés, Instagram. */
(function () {
  function prix(n, plus) {
    var t = Number(n).toFixed(2).replace('.', ',') + ' €';
    return plus ? '+' + t : t;
  }
  function item(d, plus, cls) {
    var p = document.createElement('p'); p.className = 'item' + (cls ? ' ' + cls : '');
    var s = document.createElement('span'); s.textContent = d.nom;
    var e = document.createElement('em'); e.textContent = prix(d.prix, plus);
    p.append(s, document.createElement('i'), e);
    if (d.detail) { var sm = document.createElement('small'); sm.textContent = d.detail; p.appendChild(sm); }
    return p;
  }
  function remplir(nom, liste, plus) {
    var box = document.querySelector('[data-liste="' + nom + '"]');
    if (!box || !Array.isArray(liste)) return;
    box.querySelectorAll('.item').forEach(function (p) { p.remove(); });
    liste.forEach(function (d) {
      if (!d || !d.nom) return;
      box.appendChild(item(d, plus, nom === 'options' && d.en_hiver === false ? 'ete' : ''));
    });
    box.hidden = !liste.length && nom !== 'coffee';
  }

  function appliquer(c) {
    var root = document.documentElement;
    if (c.saison === 'hiver') root.setAttribute('data-saison', 'hiver'); else root.removeAttribute('data-saison');

    var k = c.carte || {};
    remplir('coffee', k.coffee); remplir('sans_cafe', k.sans_cafe); remplir('specials', k.specials);
    remplir('hiver', k.hiver); remplir('options', k.options, true);

    // annonce du moment (ex. « Fermé ce week-end »)
    var a = document.getElementById('annonce');
    if (a) {
      var on = c.annonce && c.annonce.afficher && c.annonce.texte;
      a.hidden = !on; if (on) a.textContent = c.annonce.texte;
    }

    // données pour Google : la carte affichée
    var ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      try {
        var j = JSON.parse(ld.textContent);
        var sec = function (name, l, plus) {
          return { '@type': 'MenuSection', name: name, hasMenuItem: (l || []).filter(function (d) { return d && d.nom; }).map(function (d) {
            var m = { '@type': 'MenuItem', name: d.nom, offers: { '@type': 'Offer', price: Number(d.prix).toFixed(2), priceCurrency: 'EUR' } };
            if (d.detail) m.description = d.detail; return m;
          }) };
        };
        var hiver = c.saison === 'hiver';
        var opts = (k.options || []).filter(function (d) { return !hiver || d.en_hiver !== false; });
        var sections = [sec('Coffee', k.coffee)].concat(hiver ? [sec('Winter drinks', k.hiver)] : [sec('No beans', k.sans_cafe), sec('Specials', k.specials)], [sec('Options', opts)]);
        var all = [].concat(k.coffee || [], hiver ? (k.hiver || []) : [].concat(k.sans_cafe || [], k.specials || [])).map(function (d) { return Number(d.prix); }).filter(isFinite);
        (j['@graph'] || []).forEach(function (g) {
          if (g.hasMenu) g.hasMenu.hasMenuSection = sections;
          if (g.priceRange && all.length) g.priceRange = prix(Math.min.apply(0, all)) + ' – ' + prix(Math.max.apply(0, all));
        });
        ld.textContent = JSON.stringify(j);
      } catch (e) {}
    }
  }

  // « no-cache » : le navigateur revérifie le fichier, une modification se voit tout de suite
  window.busePret = fetch('contenu.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (c) { appliquer(c); return c; })
    .catch(function () { return null; }); // pas de fichier : la carte écrite dans la page reste
})();
