/* Test de l'admin sur l'ordinateur, avec exactement les mêmes fonctions et la même sécurité qu'en ligne.
   node outils/admin-local.mjs  → http://localhost:8090/admin/
   Crée des accès de test (affichés au démarrage) et écrit dans buse/contenu.json au lieu de GitHub. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { connexion, publier } from '../buse/netlify/lib/handlers.mjs';
import { empreinte, base32, codeTotp } from '../buse/netlify/lib/securite.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'buse');
const PORT = 8090;
const MDP = process.env.TEST_MDP || 'test-' + crypto.randomBytes(4).toString('hex');
const TOTP = process.env.TEST_TOTP || base32(crypto.randomBytes(20));
const env = { ADMIN_MOT_DE_PASSE_HASH: empreinte(MDP), ADMIN_TOTP_SECRET: TOTP, SESSION_SECRET: crypto.randomBytes(32).toString('base64url'), ADMIN_ORIGINE: `http://localhost:${PORT}` };
const m = new Map();
const store = { get: async (k) => (m.has(k) ? JSON.parse(m.get(k)) : null), setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); }, delete: async (k) => { m.delete(k); } };
const ecrire = async (_env, c) => fs.writeFileSync(path.join(ROOT, 'contenu.json'), JSON.stringify(c, null, 2) + '\n');
const routes = { '/api/connexion': connexion({ env, store, delai: 50 }), '/api/publier': publier({ env, ecrire }) };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (routes[url.pathname]) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await routes[url.pathname](new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), { ip: req.socket.remoteAddress });
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let f = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const h = { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' };
  if (url.pathname.startsWith('/admin/')) h['Content-Security-Policy'] = CSP;
  res.writeHead(200, h); fs.createReadStream(f).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Admin de test : http://localhost:${PORT}/admin/\nMot de passe : ${MDP}\nClé TOTP : ${TOTP}\nCode actuel : ${codeTotp(TOTP, Math.floor(Date.now() / 30000))}`);
});
