import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== 'test_key') {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or missing API key' });
    return;
  }
  
  next();
}
