# Sites pour commerçants

Sites vitrines statiques (HTML, CSS, JavaScript), hébergés gratuitement sur GitHub Pages.

En ligne : https://gaelflk-blip.github.io/site-commercant-/

## Sites

| Commerçant | Dossier | Adresse |
|---|---|---|
| Aslan Börek (food truck) | `aslan-borek/` | https://gaelflk-blip.github.io/site-commercant-/aslan-borek/ |
| Büse (café ambulant) | `buse/` | https://gaelflk-blip.github.io/site-commercant-/buse/ |

## Ajouter un nouveau commerçant

1. Copier le dossier `aslan-borek/` sous un nouveau nom (ex. `boulangerie-dupont/`).
2. Remplacer les photos dans `img/`, le logo, les textes, la carte et les contacts.
3. Refaire l'identité visuelle (couleurs, polices, motif) à partir de l'univers du commerce : voir le skill `.claude/skills/frontend-design`.
4. Remplir `mentions-legales.html` et `confidentialite.html` avec les infos du commerçant (BCE, adresse, etc.).
5. Ajouter une carte dans `index.html` à la racine et une ligne dans le tableau ci-dessus.

## Ce que contient chaque site

- `index.html` : la page principale.
- `traiteur/` : la page de demande de devis (si le commerçant fait de l'événementiel). Le formulaire prépare un e-mail ou un message WhatsApp, sans rien stocker.
- `mentions-legales.html` et `confidentialite.html` : les pages légales belges (Code de droit économique art. III.74 et XII.6, RGPD).
- `animations.js` : les animations (GSAP + ScrollTrigger + SplitText, défilement fluide Lenis). Elles se coupent si le visiteur a demandé moins d'animations.
- `vendor/` : les bibliothèques, hébergées sur place (GSAP 3.15.1, Lenis 1.3.27).
- `fonts/` : les polices, hébergées sur place, sans appel à Google, donc sans cookie ni bannière.

## Règles

- Pas de cookies ni de traceurs : pas de Google Fonts, Google Analytics ou pixels.
- Pas de prix inventés : on n'affiche que ce que le commerçant a confirmé.
- Photos : pas de clients reconnaissables sans leur accord.
