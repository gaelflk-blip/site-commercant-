/* Crée les accès de l'admin d'un commerçant.
   node outils/creer-acces.mjs "Büse"
   → affiche les valeurs à coller dans Netlify (Variables d'environnement), le mot de passe
     et le lien à transformer en QR code pour l'appli d'authentification du commerçant.
   Ne jamais mettre ces valeurs dans le dépôt (il est public). */
import crypto from 'node:crypto';
import { empreinte, base32 } from '../buse/netlify/lib/securite.mjs';

const nom = process.argv[2] || 'Commerçant';
const mots = ['cafe', 'grain', 'tasse', 'mousse', 'sucre', 'lait', 'camion', 'matin', 'soleil', 'marche', 'velo', 'nuage',
  'cerise', 'pomme', 'menthe', 'vanille', 'cacao', 'biscuit', 'cannelle', 'noisette', 'orange', 'citron', 'olive', 'figue'];
// 5 mots au hasard + 2 chiffres : facile à retenir, très long à deviner
const motdepasse = Array.from({ length: 5 }, () => mots[crypto.randomInt(mots.length)]).join('-') + '-' + crypto.randomInt(10, 100);
const totp = base32(crypto.randomBytes(20));
const lien = `otpauth://totp/${encodeURIComponent(nom + ' admin')}?secret=${totp}&issuer=${encodeURIComponent(nom)}&algorithm=SHA1&digits=6&period=30`;

console.log(`
=== À coller dans Netlify : Site configuration > Environment variables ===
ADMIN_MOT_DE_PASSE_HASH = ${empreinte(motdepasse)}
ADMIN_TOTP_SECRET       = ${totp}
SESSION_SECRET          = ${crypto.randomBytes(32).toString('base64url')}
GITHUB_REPO             = (ex. gaelflk-blip/site-buse)
GITHUB_BRANCH           = (ex. main)
CONTENU_CHEMIN          = (ex. contenu.json)
GITHUB_TOKEN            = (jeton GitHub « fine-grained » : ce dépôt seulement, Contents: Read and write)

=== À donner au commerçant (en main propre, pas par e-mail) ===
Mot de passe : ${motdepasse}
Appli d'authentification (Google Authenticator, Microsoft Authenticator…) :
  scanner le QR code de ce lien : ${lien}
  ou saisir la clé : ${totp}
`);
