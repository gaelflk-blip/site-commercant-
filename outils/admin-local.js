/* Serveur de test de l'admin, sur l'ordinateur uniquement.
   node outils/admin-local.js  → l'admin http://localhost:8765/buse/admin/ enregistre dans buse/contenu.json.
   En ligne, c'est une fonction de l'hébergeur (Netlify) qui fait ce travail, avec mot de passe. */
const http = require('http'), fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', 'buse', 'contenu.json');
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8765');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method !== 'POST' || req.url !== '/api/publier') { res.writeHead(404); return res.end(); }
  let body = '';
  req.on('data', c => { body += c; if (body.length > 200000) req.destroy(); });
  req.on('end', () => {
    try {
      const c = JSON.parse(body).contenu;
      if (!c || !c.carte || !c.saison) throw new Error('contenu invalide');
      fs.writeFileSync(FILE, JSON.stringify(c, null, 2) + '\n');
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}');
    } catch (e) { res.writeHead(400); res.end(); }
  });
}).listen(8082, '127.0.0.1', () => console.log('Admin local prêt sur http://localhost:8082'));
