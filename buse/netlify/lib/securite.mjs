/* Sécurité de l'admin Büse (fonctions serveur Netlify).
   Rien ici n'est secret : les secrets sont dans les variables d'environnement de Netlify.

   Protections :
   1. Mot de passe (stocké seulement sous forme d'empreinte scrypt) + code à 6 chiffres
      d'une appli d'authentification (TOTP), chaque code utilisable une seule fois.
   2. Blocage après trop d'essais ratés (par adresse IP et au total).
   3. Session signée (HMAC), cookie HttpOnly + Secure + SameSite=Strict, 8 heures maximum.
   4. Requêtes acceptées seulement depuis le site lui-même (en-tête Origin).
   5. Contenu vérifié champ par champ : seuls les champs prévus, types et longueurs limités,
      liens Instagram seulement, aucun caractère < ou >.
   6. Le jeton GitHub reste sur le serveur et n'écrit qu'un seul fichier : contenu.json.
   7. Chaque publication est un commit : on peut revenir en arrière à tout moment. */
import crypto from 'node:crypto';

export const SESSION_HEURES = 8;
const ESSAIS_IP = 5, FENETRE_IP_MIN = 15;      // 5 essais ratés par IP en 15 min
const ESSAIS_TOTAL = 20, FENETRE_TOTAL_MIN = 60; // 20 essais ratés au total en 1 h → admin fermé 1 h

/* ---------- Réponses ---------- */
export function json(status, data, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }
  });
}

/* ---------- Origine : la requête doit venir du site lui-même ---------- */
export function origineOk(req, env) {
  const o = req.headers.get('origin');
  if (!o) return false;
  const permis = [env.URL, env.DEPLOY_PRIME_URL, env.ADMIN_ORIGINE].filter(Boolean).map(u => new URL(u).origin);
  try { return permis.includes(new URL(o).origin); } catch { return false; }
}
export function ip(req, context) {
  return (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'inconnue';
}

/* ---------- Mot de passe (scrypt) ---------- */
// format de l'empreinte : scrypt$N$r$p$selBase64$empreinteBase64
export function empreinte(motdepasse, sel = crypto.randomBytes(16)) {
  const N = 32768, r = 8, p = 1;
  const h = crypto.scryptSync(String(motdepasse).normalize('NFKC'), sel, 32, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return ['scrypt', N, r, p, sel.toString('base64'), h.toString('base64')].join('$');
}
export function verifierMotDePasse(motdepasse, stocke) {
  try {
    const [algo, N, r, p, sel, h] = String(stocke).split('$');
    if (algo !== 'scrypt') return false;
    const attendu = Buffer.from(h, 'base64');
    const calc = crypto.scryptSync(String(motdepasse).normalize('NFKC'), Buffer.from(sel, 'base64'), attendu.length, { N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
    return crypto.timingSafeEqual(calc, attendu);
  } catch { return false; }
}

/* ---------- Code à 6 chiffres (TOTP, RFC 6238) ---------- */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(buf) {
  let bits = 0, val = 0, out = '';
  for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function deBase32(s) {
  const clean = String(s).toUpperCase().replace(/[^A-Z2-7]/g, ''); let bits = 0, val = 0; const out = [];
  for (const c of clean) { val = (val << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}
export function codeTotp(secret, compteur) {
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(compteur));
  const h = crypto.createHmac('sha1', deBase32(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0');
}
// renvoie le compteur utilisé (pour refuser qu'un même code serve deux fois), ou -1
export function verifierTotp(secret, code, maintenant = Date.now()) {
  if (!/^\d{6}$/.test(String(code))) return -1;
  const t = Math.floor(maintenant / 30000);
  for (const d of [0, -1, 1]) {
    const a = Buffer.from(codeTotp(secret, t + d)), b = Buffer.from(String(code));
    if (crypto.timingSafeEqual(a, b)) return t + d;
  }
  return -1;
}

/* ---------- Session signée ---------- */
export function creerSession(secret, maintenant = Date.now()) {
  const data = Buffer.from(JSON.stringify({ exp: maintenant + SESSION_HEURES * 3600e3, n: crypto.randomBytes(12).toString('base64url') })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return data + '.' + sig;
}
export function sessionValide(jeton, secret, maintenant = Date.now()) {
  if (!jeton || !secret) return false;
  const [data, sig] = String(jeton).split('.');
  if (!data || !sig) return false;
  const attendu = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(attendu);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(data, 'base64url').toString()).exp > maintenant; } catch { return false; }
}
export function lireCookie(req, nom) {
  const m = (req.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(nom + '='));
  return m ? decodeURIComponent(m.slice(nom.length + 1)) : '';
}
export const COOKIE = '__Host-buse-admin';
export function cookieSession(jeton) {
  return `${COOKIE}=${jeton}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HEURES * 3600}`;
}
export function cookieEfface() { return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`; }

/* ---------- Blocage après trop d'essais (stockage Netlify Blobs) ---------- */
export async function bloque(store, cleIp, maintenant = Date.now()) {
  const total = (await store.get('echecs-total', { type: 'json' })) || [];
  const parIp = (await store.get('echecs-' + cleIp, { type: 'json' })) || [];
  const recentsTotal = total.filter(t => t > maintenant - FENETRE_TOTAL_MIN * 60e3);
  const recentsIp = parIp.filter(t => t > maintenant - FENETRE_IP_MIN * 60e3);
  return recentsIp.length >= ESSAIS_IP || recentsTotal.length >= ESSAIS_TOTAL;
}
export async function noterEchec(store, cleIp, maintenant = Date.now()) {
  for (const [k, min] of [['echecs-total', FENETRE_TOTAL_MIN], ['echecs-' + cleIp, FENETRE_IP_MIN]]) {
    const l = ((await store.get(k, { type: 'json' })) || []).filter(t => t > maintenant - min * 60e3);
    l.push(maintenant); await store.setJSON(k, l.slice(-50));
  }
}
export async function effacerEchecs(store, cleIp) { await store.delete('echecs-' + cleIp); }

/* ---------- Vérification du contenu envoyé ---------- */
const TEXTE_OK = /^[^<>\u0000-\u001f\u007f]*$/; // pas de balise HTML, pas de caractère de contrôle
function texte(v, max, obligatoire) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw new Error('texte attendu');
  v = v.trim();
  if (obligatoire && !v) throw new Error('texte vide');
  if (v.length > max || !TEXTE_OK.test(v)) throw new Error('texte refusé');
  return v;
}
function prix(v) {
  if (typeof v !== 'number' || !isFinite(v) || v < 0 || v > 100) throw new Error('prix refusé');
  return Math.round(v * 100) / 100;
}
function liste(v, max, fn) {
  if (!Array.isArray(v) || v.length > max) throw new Error('liste refusée');
  return v.map(fn);
}
const IG = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]{5,40}\/?(\?[A-Za-z0-9=&_-]{0,80})?$/;

export function verifierContenu(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('contenu refusé');
  const boisson = d => {
    if (!d || typeof d !== 'object') throw new Error('boisson refusée');
    const o = { nom: texte(d.nom, 60, true), prix: prix(d.prix), detail: texte(d.detail, 120) };
    if (d.masque === true) o.masque = true;
    return o;
  };
  const k = c.carte || {};
  return {
    saison: c.saison === 'hiver' ? 'hiver' : 'normale',
    annonce: { afficher: c.annonce && c.annonce.afficher === true, texte: texte(c.annonce && c.annonce.texte, 90) },
    carte: {
      coffee: liste(k.coffee || [], 40, boisson),
      sans_cafe: liste(k.sans_cafe || [], 40, boisson),
      specials: liste(k.specials || [], 40, boisson),
      hiver: liste(k.hiver || [], 40, boisson),
      options: liste(k.options || [], 20, d => ({ ...boisson(d), en_hiver: d.en_hiver !== false }))
    },
    marches: liste(c.marches || [], 12, m => ({ nom: texte(m && m.nom, 80, true), quand: texte(m && m.quand, 80), adresse: texte(m && m.adresse, 140) })),
    instagram: liste(c.instagram || [], 6, x => {
      const lien = texte(x && x.lien, 200, true);
      if (!IG.test(lien)) throw new Error('lien Instagram refusé');
      return { lien };
    })
  };
}

/* ---------- Écriture du fichier sur GitHub ---------- */
export async function ecrireSurGithub(env, contenu, fetchFn = fetch) {
  const repo = env.GITHUB_REPO, branche = env.GITHUB_BRANCH, chemin = env.CONTENU_CHEMIN || 'buse/contenu.json';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '') || !env.GITHUB_TOKEN) throw new Error('configuration GitHub manquante');
  const url = `https://api.github.com/repos/${repo}/contents/${chemin.split('/').map(encodeURIComponent).join('/')}`;
  const h = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'buse-admin' };
  const r1 = await fetchFn(`${url}?ref=${encodeURIComponent(branche)}`, { headers: h });
  if (!r1.ok) throw new Error('lecture GitHub ' + r1.status);
  const { sha } = await r1.json();
  const r2 = await fetchFn(url, {
    method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Admin Büse : mise à jour de la carte',
      content: Buffer.from(JSON.stringify(contenu, null, 2) + '\n').toString('base64'),
      sha, branch: branche
    })
  });
  if (!r2.ok) throw new Error('écriture GitHub ' + r2.status);
}
