import { Request, Response, NextFunction } from 'express';
import { IdempotencyService } from '../services/IdempotencyService';
import { IdempotencyRequest } from '../types';

export function idempotencyMiddleware(idempotencyService: IdempotencyService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      res.status(400).json({ 
        error: 'MISSING_IDEMPOTENCY_KEY', 
        message: 'Idempotency-Key header is required' 
      });
      return;
    }

    try {
      const existing = idempotencyService.check(
        idempotencyKey,
        req.method,
        req.path,
        req.body
      );

      if (existing) {
        res.status(200).json(existing.response);
        return;
      }

      (req as IdempotencyRequest).idempotencyKey = idempotencyKey;
      next();
    } catch (error: any) {
      if (error.message === 'IDEMPOTENCY_CONFLICT') {
        res.status(409).json({
          error: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key used with different request parameters',
        });
        return;
      }
      throw error;
    }
  };
}
