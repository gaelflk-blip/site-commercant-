# Mémoire du projet : sites pour commerçants

Ce fichier est lu à chaque session. Il résume la méthode, les choix de design et les leçons apprises.
Mets-le à jour quand une décision change.

## Le projet

- Gaël crée des sites vitrines pour des commerçants (marchés, food trucks, cafés) en Belgique, surtout à Bruxelles.
- Il a déjà son statut d'indépendant et facture. Prix visé : 250 à 350 € (formule Essentiel ~250 €, Premium ~350-450 €, suivi optionnel 15-25 €/mois).
- Gaël écrit en français familier, souvent depuis son iPhone. Réponds en français simple, avec des captures ou des vidéos du rendu.
- Les sites sont prévisualisés sur GitHub Pages (branche `claude/amazing-noether-no3jhv`), puis hébergés ailleurs à la livraison. Le dépôt est public.
- Un dossier par commerçant : `aslan-borek/`, `buse/`. La page `index.html` à la racine liste les sites.
- Avant de publier pour de vrai, Gaël montre le site au commerçant et récupère les dernières infos.

## Sites réalisés

| Site | Univers | Signature |
|---|---|---|
| `aslan-borek/` (food truck börek, Citroën Type H) | Rouge du logo, doré, bleu « carreaux de ciment », crème. Police Bricolage Grotesque + Figtree. Lion du logo en sticker | Affiche rouge avec « ASLAN BÖREK » géant, badge doré qui tourne, étoiles. Sections en cartes de couleur arrondies. Vidéos Gemini des étapes. Page `traiteur/` avec formulaire de devis |
| `buse/` (café ambulant, Piaggio Ape noir) | Noir, blanc, rouge, rose des gobelets. Lilita One (titres), Space Mono (style menu papier), Figtree | Les 3 grains du logo tombent dans le « U » qui sourit, puis le sourire se remplit de café. Carte façon menu papier imprimé. Boissons signature en cartes de couleur. Plan technique rouge du camion. Section événements privés |

**Büse, carte de saison** : `<html data-saison="hiver">` n'affiche que la carte d'hiver (classes `.hiver` / `.ete` sur la carte papier, les cartes boissons et le Sirop). Pour revenir à la carte normale : retirer l'attribut et remettre dans le JSON-LD les sections No beans, Specials et le Sirop (Coffee reste toute l'année) (voir le commit « carte d'hiver » v10 dans l'historique).

Infos encore manquantes : voir les champs `[entre crochets]` surlignés en jaune dans les `mentions-legales.html`, et les commentaires `À COMPLÉTER` dans le code.

## Méthode de design (ce qui marche)

1. **Partir de l'univers réel du commerçant** : couleurs du logo, du camion, des gobelets, de son menu papier. Chaque site doit être reconnaissable et différent des autres. Ne pas copier les sites de référence.
2. **Références** que Gaël aime (Awwwards) : TÒPAS, Burrito Madre, Délice. Leur secret, c'est la personnalité, pas le nombre d'animations : typo géante, couleurs franches, produit ou mascotte en héros, bandeau penché, sections en cartes arrondies.
3. **Une seule signature forte en haut de page**, le reste sobre. Gaël veut « beau, fluide, moderne, pas surchargé ».
4. **Le logo est un matériau** : le découper (sticker, grains séparés, masque du sourire) pour l'animer.
5. **Une couleur par section**, deux sections voisines jamais de la même couleur.
6. **Textes courts et percutants** (« On étale. On garnit. On dore. », « Cherchez le lion rouge. »). Jamais de fait inventé : prix, lieux, avis, années, ingrédients doivent venir du commerçant ou de ses photos.
7. **Pas de photo où un visage est reconnaissable** sans accord.
8. Gaël a trouvé le börek détouré géant « trop » : éviter les détourages IA en très grand, ils manquent de netteté.

## Technique (stack et règles)

- HTML + CSS inline + JS, sans framework. **GSAP 3.15.1** (ScrollTrigger, SplitText) et **Lenis 1.3.27**, copiés dans `vendor/` depuis npm (jsDelivr et unpkg sont bloqués ici, npm fonctionne).
- **Polices hébergées sur le site** (`fonts/`, téléchargées depuis Google Fonts) : aucun appel à Google, donc pas de cookie.
- **Numéros de version `?v=N`** sur tous les fichiers. À augmenter à chaque mise à jour, sinon Chrome sur iPhone garde l'ancienne version (GitHub Pages met en cache 10 minutes). Donner à Gaël le lien avec `?v=N`.
- Tester avec Playwright (`python3 -m http.server 8765` à la racine du dépôt) : ordinateur 1440×860 et `devices['iPhone 13']`, processeur ralenti ×4 (`Emulation.setCPUThrottlingRate`). Vérifier : pas d'erreur console, `scrollWidth` = largeur d'écran, aucun élément resté caché après défilement, contrastes, focus clavier, `reducedMotion:'reduce'`.
- Les commandes avec `rm -rf` sur des variables ou des sous-shells complexes sont bloquées par la sécurité : écrire les scripts dans des fichiers et utiliser des chemins explicites.

## Leçons apprises (bugs déjà rencontrés)

- **Vidéo pilotée par le défilement** (scrub) : Gaël ne l'aime pas (« elle recule quand je remonte ») et ça saccade sur iPhone. Utiliser une **vraie vidéo** `<video muted playsinline>` en lecture automatique, jouée une fois, mise en pause hors écran, jamais rembobinée au défilement.
- **Une seule vidéo à la fois** (la plus visible). Plusieurs vidéos décodées ensemble = saccades.
- **Mode Économie d'énergie iPhone** : la lecture automatique est bloquée. Prévoir un bouton « Voir la vidéo » et lancer la vidéo au premier contact avec l'écran.
- **Ne jamais cacher le titre ou l'image principale en attendant le JavaScript** (`visibility:hidden`) : écran vide de 2 à 3 s en 4G. Animer depuis un état visible.
- **GSAP et les transformations CSS** : si un élément a déjà un `transform` en CSS, GSAP l'additionne. Positionner avec GSAP (`xPercent`, `yPercent`) ou mettre un conteneur.
- **SplitText avec `mask`** coupe les accents (trémas du Ö) : `revert()` après l'intro, et un interligne d'au moins 0.9 sur les titres géants.
- `html{scroll-behavior:smooth}` + Lenis = conflit : ajouter `html.lenis{scroll-behavior:auto}`. Lenis désactivé sur écran tactile.
- `overflow-x:clip` n'existe pas avant iOS 16 : mettre `overflow-x:hidden` avant.
- **WebGL** (photo en relief) : ne redessiner que si quelque chose bouge, résolution 1× sur téléphone, gérer `webglcontextlost`.
- La barre fixe « Appeler » sur mobile ne doit pas cacher les boutons du haut : l'afficher seulement après le haut de page.
- Une image en niveaux de gris sans canal alpha ne marche pas comme masque CSS : la convertir en PNG avec transparence.
- Contenu qui apparaît au défilement (`.reveal` à opacité 0) : l'afficher tout de suite s'il reçoit le focus **au clavier** (`:focus-visible`), pas au clic souris (sinon l'élément bouge pendant le clic et le clic est perdu).
- **Apparitions au défilement : animer `opacity`, pas `autoAlpha`** (qui met `visibility:hidden` : liens et champs deviennent inatteignables au clavier). Et ne pas relancer l'animation d'un élément déjà affiché par le focus (`data-shown`).
- Formulaires : vérifier les valeurs (date à venir, minimum, e-mail ou téléphone), message sous chaque champ avec `aria-invalid` et `aria-describedby`, confirmation en `role="status"`. Ouvrir un lien externe pendant le clic, pas après une promesse (Safari bloque).

## Médias et IA

- **Higgsfield** : compte gratuit (10 crédits), les vidéos exigent un abonnement payant. Gaël ne veut pas dépenser de crédits pour des tests. Toujours donner le prix et attendre son accord.
- Gaël paie **Gemini** et **ChatGPT** : on génère les vidéos (Veo) et les images (Nano Banana) dans **son appli Gemini**. Je prépare les photos et les prompts, il génère, il dépose sur son **Google Drive (gaelflk@gmail.com)** et je récupère avec le connecteur Drive.
- Prompts vidéo stricts : « Utilise cette photo exactement comme première image… Ne change rien… N'ajoute aucun ingrédient, aucune personne… Seul mouvement : … Pas de fumée, pas de texte, pas de musique. » **Une nouvelle discussion Gemini par vidéo**, sinon il mélange les photos. Vérifier chaque vidéo : Gemini invente parfois des ingrédients ou un faux logo (recadrer si besoin).
- Nano Banana : détourage sur **fond vert #00FF00** (je découpe moi-même), cartes de profondeur pour l'effet relief.

## Skills installés dans `.claude/skills/`

Installés après une revue de sécurité (novembre 2026), seulement les parties sûres, sans hook ni changement de réglages :
- `frontend-design`, `webapp-testing` (Anthropic).
- `hallmark` (Nutlope/hallmark) : anti « look IA ». Scripts d'installation, de hook et de génération d'images retirés. `scripts/sloplint.mjs` (mode statique) peut servir à vérifier une page. Utiliser le mode « brand-truth » : l'univers du commerçant, pas ses thèmes au hasard.
- `impeccable` (pbakaus/impeccable) : seulement `SKILL.md` + `reference/` (relecture façon graphiste : critique, audit, polish, typo, mise en page, animation). Le dossier `scripts/` est volontairement absent (binaire fermé + télémétrie) : prendre le chemin « launcher unavailable » et ne jamais télécharger ce binaire.
- SEO (AgriciDaniel/claude-seo) : `seo-local`, `seo-schema` (+ `schema-templates.json`), `seo-page`, `seo-technical`, `seo-sitemap`, `seo-images`, `seo-hreflang`, utilisés comme listes de contrôle. Leurs scripts Python ne sont pas installés. Ne pas installer `install.sh`, les hooks, les agents, les extensions ni `seo-flow`. Ne jamais reprendre leurs « statistiques » comme des faits.
- Refusé : `agent-browser` (Vercel) — il veut remplacer Playwright et pré-autorise toutes ses commandes.

**En cas de conflit, ce fichier gagne sur les skills** : garder `overflow-x:hidden` avant `clip` (iOS < 16), les petits titres en capitales espacées sont autorisés quand ils viennent de la marque (ex. menu papier de Büse), et jamais de fait inventé.

## Admin pour les commerçants (essai sur Büse)

- Le contenu qui change souvent est dans `buse/contenu.json` (saison hiver/normale, carte et prix, `masque` = boisson indisponible, options, annonce du moment, marchés, liens Instagram). `contenu.js` l'applique à la page au chargement (`fetch` en `no-cache`) ; la carte écrite dans le HTML sert de secours. `consent.js` lit marchés et Instagram depuis ce fichier.
- **Admin maison** `buse/admin/index.html` (Decap a été essayé puis abandonné : fait pour ordinateur, peu lisible sur iPhone). Pensé téléphone, inspiré des meilleurs éditeurs : toucher une ligne pour la modifier (Shopify), prix avec −/+, interrupteur « Disponible » (rupture), choix de saison en un geste, annonce avec idées de messages, onglet **Aperçu** en direct (iframe `?apercu=1` + `postMessage`, même origine), brouillon gardé dans le navigateur (rien n'est perdu), **liste des changements avant de publier** (« Espresso : 2,50 € → 2,80 € »), « Tout annuler ».
- Publication : `POST /api/publier` avec en-tête `X-Admin-Password`. Test sur l'ordinateur : `node outils/admin-local.js` (port 8082, écrit `buse/contenu.json`). **En ligne : à faire au moment de l'hébergement** (fonction Netlify qui vérifie le mot de passe et écrit `contenu.json` via l'API GitHub avec un jeton gardé côté serveur ; le commerçant n'a pas besoin de compte GitHub).
- Pour Aslan, même principe à reproduire si Gaël valide.

## SEO et mise en ligne

- **Aperçu GitHub Pages = `noindex`** (balise `robots` dans le `<head>`), pour que l'adresse github.io ne concurrence pas le futur domaine.
- Chaque page publique a : titre et description avec la ville (« à Bruxelles »), `canonical`, Open Graph et Twitter en URL absolues (image de partage 1200×630 `img/partage.jpg`), icônes (`favicon-48/96.png`, `apple-touch-icon.png`), JSON-LD (Büse : `CafeOrCoffeeShop` sans adresse, `areaServed` Bruxelles, carte et prix). Le h1 image a un vrai `alt`.
- Ne jamais mettre de téléphone, e-mail, horaires, adresse ou avis dans le JSON-LD tant qu'ils ne sont pas confirmés.
- **Checklist le jour du lancement sur le domaine** : retirer le `noindex` ; remplacer `https://gaelflk-blip.github.io/site-commercant-/<site>/` par le domaine partout (canonical, og:url, og:image, JSON-LD) ; ajouter `robots.txt` et `sitemap.xml` à la racine du domaine (pages légales exclues) ; mettre à jour l'hébergeur dans `mentions-legales.html` et `confidentialite.html` ; créer la fiche Google Business Profile (entreprise de zone de service) avec les mêmes nom, téléphone et infos que le site et Instagram.
- Pas de version NL pour l'instant ; si un jour : `/nl/` + hreflang `fr`/`nl`/`x-default` (jamais `be`, c'est le biélorusse).

## Légal (Belgique)

- Pages `mentions-legales.html` (Code de droit économique art. III.74 et XII.6 : nom, BCE, TVA, adresse, autorisation ambulante, AFSCA) et `confidentialite.html` (RGPD, Autorité de protection des données).
- **Par défaut aucun cookie** : polices locales, pas de statistiques. Si on intègre Instagram ou Google Maps, bannière de consentement (Accepter / Refuser de même taille), rien chargé avant l'accord (voir `aslan-borek/consent.js` et `buse/consent.js` : listes `INSTAGRAM_POSTS` et `MARCHES` à remplir, bannière seulement si elles ne sont pas vides).
- Allergènes : mention sous la carte (règlement UE 1169/2011).
- Les formulaires de devis préparent un e-mail, un message WhatsApp ou Instagram, et ne stockent rien.
- Rappeler à Gaël de faire valider par son comptable, et la facturation électronique Peppol obligatoire en Belgique depuis 2026.

## Ajouter un commerçant

1. Demander : type de commerce, photos, logo (PDF ou PNG), infos (nom, ville, horaires, contacts, réseaux, carte), formule.
2. Créer un dossier, copier `vendor/`, télécharger les polices choisies dans `fonts/`, préparer les images en WebP (largeur ~700 px pour les photos).
3. Construire un univers propre au commerce (voir Méthode de design), tester, publier, envoyer captures et vidéo à Gaël.
4. Ajouter le site dans `index.html` à la racine et dans le `README.md`.
