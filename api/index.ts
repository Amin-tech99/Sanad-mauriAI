// Vercel serverless function entry point
import { createServer } from '../server/index';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Optional: Enable edge runtime for better performance
// export const config = { runtime: 'edge' };

let app: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!app) {
      app = await createServer();
    }
    
    // Ensure the app is properly initialized
    if (typeof app === 'function') {
      return app(req, res);
    } else {
      // If createServer returns an Express instance, not a handler
      return new Promise((resolve, reject) => {
        app.handle(req, res, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}