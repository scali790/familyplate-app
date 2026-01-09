import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createExpressApp } from '../server/_core/index.js';

let app: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createExpressApp();
  }
  return app(req, res);
}
