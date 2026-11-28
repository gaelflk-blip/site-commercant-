import { publier } from '../lib/handlers.mjs';
export default (req, context) => publier({ env: process.env })(req, context);
export const config = { path: '/api/publier' };
