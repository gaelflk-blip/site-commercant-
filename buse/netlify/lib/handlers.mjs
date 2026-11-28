/* Logique des fonctions, séparée pour pouvoir la tester sur l'ordinateur (outils/admin-local.mjs). */
import * as S from './securite.mjs';

// deps : { env, store (Netlify Blobs), fetch, now() }
export function connexion(deps) {
  return async (req, context) => {
    const { env, store } = deps, now = deps.now ? deps.now() : Date.now();
    if (!env.SESSION_SECRET || !env.ADMIN_MOT_DE_PASSE_HASH || !env.ADMIN_TOTP_SECRET) return S.json(503, { erreur: 'Admin pas encore configuré.' });

    if (req.method === 'GET') { // la session est-elle encore valable ?
      return S.sessionValide(S.lireCookie(req, S.COOKIE), env.SESSION_SECRET, now) ? S.json(200, { ok: true }) : S.json(401, { erreur: 'Non connecté.' });
    }
    if (!S.origineOk(req, env)) return S.json(403, { erreur: 'Origine refusée.' });
    if (req.method === 'DELETE') return S.json(200, { ok: true }, { 'Set-Cookie': S.cookieEfface() });
    if (req.method !== 'POST') return S.json(405, { erreur: 'Méthode refusée.' });

    const cle = S.ip(req, context).replace(/[^\w.:-]/g, '_').slice(0, 64);
    if (await S.bloque(store, cle, now)) return S.json(429, { erreur: 'Trop d\'essais. Réessayez dans 15 minutes.' });

    let corps; try { corps = await req.json(); } catch { corps = {}; }
    const mdp = typeof corps.motdepasse === 'string' ? corps.motdepasse.slice(0, 200) : '';
    const okMdp = S.verifierMotDePasse(mdp, env.ADMIN_MOT_DE_PASSE_HASH);
    const compteur = S.verifierTotp(env.ADMIN_TOTP_SECRET, corps.code, now);
    const dernier = (await store.get('totp-dernier', { type: 'json' })) || -1;
    if (!okMdp || compteur < 0 || compteur <= dernier) {
      await S.noterEchec(store, cle, now);
      await new Promise(r => setTimeout(r, deps.delai ?? 600)); // ralentit les essais en série
      return S.json(401, { erreur: 'Mot de passe ou code incorrect.' });
    }
    await store.setJSON('totp-dernier', compteur); // un code ne sert qu'une fois
    await S.effacerEchecs(store, cle);
    return S.json(200, { ok: true }, { 'Set-Cookie': S.cookieSession(S.creerSession(env.SESSION_SECRET, now)) });
  };
}

export function publier(deps) {
  return async (req) => {
    const { env } = deps, now = deps.now ? deps.now() : Date.now();
    if (req.method !== 'POST') return S.json(405, { erreur: 'Méthode refusée.' });
    if (!S.origineOk(req, env)) return S.json(403, { erreur: 'Origine refusée.' });
    if (!S.sessionValide(S.lireCookie(req, S.COOKIE), env.SESSION_SECRET, now)) return S.json(401, { erreur: 'Session expirée, reconnectez-vous.' });
    const taille = +(req.headers.get('content-length') || 0);
    if (taille > 100000) return S.json(413, { erreur: 'Contenu trop gros.' });
    let propre;
    try { const corps = await req.json(); propre = S.verifierContenu(corps.contenu); }
    catch (e) { return S.json(400, { erreur: 'Contenu refusé : ' + e.message }); }
    try { await (deps.ecrire || S.ecrireSurGithub)(env, propre, deps.fetch); }
    catch (e) { console.error('publication', e.message); return S.json(502, { erreur: 'La publication n\'a pas marché.' }); }
    return S.json(200, { ok: true });
  };
}
