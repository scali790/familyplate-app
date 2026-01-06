// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createExpressApp } from '../server/_core/index.js';

// Cache the Express app instance
let app: ReturnType<typeof createExpressApp> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize app on first request
  if (!app) {
    app = createExpressApp();
  }
  
  // Forward request to Express app
  return new Promise((resolve, reject) => {
    app!(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
