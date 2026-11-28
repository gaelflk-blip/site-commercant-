import { getStore } from '@netlify/blobs';
import { connexion } from '../lib/handlers.mjs';
export default (req, context) => connexion({ env: process.env, store: getStore('admin-securite') })(req, context);
export const config = { path: '/api/connexion' };
