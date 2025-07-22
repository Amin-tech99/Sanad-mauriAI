// Vercel serverless function entry point
import { createServer } from '../server/index';
import { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createServer();
  }
  
  return app(req, res);
}