import express, { Request, Response } from 'express';
import { CustomerService } from './services/CustomerService';
import { PointsService } from './services/PointsService';
import { IdempotencyService } from './services/IdempotencyService';
import { authMiddleware } from './middleware/auth';
import { idempotencyMiddleware } from './middleware/idempotency';
import { EarnRequest, IdempotencyRequest, RedeemRequest } from './types';

const app = express();
app.use(express.json());
app.use(authMiddleware);

const customerService = new CustomerService();
const pointsService = new PointsService();
const idempotencyService = new IdempotencyService();

// Create customer
app.post('/customers', (req: Request, res: Response) => {
  const { phone, email } = req.body;

  if (!phone || !email) {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'phone and email are required' });
    return;
  }

  const customer = customerService.createCustomer(phone, email);
  res.json(customer);
});

// Earn points
app.post('/earn', idempotencyMiddleware(idempotencyService), (req: Request, res: Response) => {
  const { customerId, amountMinor, currency } = req.body as EarnRequest;
  const idempotencyKey = (req as IdempotencyRequest).idempotencyKey;

  if (!customerId || amountMinor === undefined || !currency) {
    res.status(400).json({ 
      error: 'INVALID_REQUEST', 
      message: 'customerId, amountMinor, and currency are required' 
    });
    return;
  }

  if (currency !== 'NGN') {
    res.status(400).json({ error: 'INVALID_CURRENCY', message: 'Only NGN currency is supported' });
    return;
  }

  const customer = customerService.getCustomer(customerId);
  if (!customer) {
    res.status(404).json({ error: 'CUSTOMER_NOT_FOUND', message: 'Customer does not exist' });
    return;
  }

  const result = pointsService.earnPoints(customerId, amountMinor);

  const response = {
    customerId,
    creditedPoints: result.creditedPoints,
    remainingDailyAllowance: result.remainingDailyAllowance,
    transaction: result.transaction,
  };

  idempotencyService.store(idempotencyKey, req.method, req.path, req.body, response);
  res.json(response);
});

// Redeem points
app.post('/redeem', idempotencyMiddleware(idempotencyService), (req: Request, res: Response) => {
  const { customerId, points } = req.body as RedeemRequest;
  const idempotencyKey = (req as IdempotencyRequest).idempotencyKey;

  if (!customerId || points === undefined) {
    res.status(400).json({ 
      error: 'INVALID_REQUEST', 
      message: 'customerId and points are required' 
    });
    return;
  }

  const customer = customerService.getCustomer(customerId);
  if (!customer) {
    res.status(404).json({ error: 'CUSTOMER_NOT_FOUND', message: 'Customer does not exist' });
    return;
  }

  try {
    const result = pointsService.redeemPoints(customerId, points);
    const response = {
      customerId,
      redeemedPoints: points,
      newBalance: result.newBalance,
    };

    idempotencyService.store(idempotencyKey, req.method, req.path, req.body, response);
    res.json(response);
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_POINTS') {
      res.status(400).json({ 
        error: 'INSUFFICIENT_POINTS', 
        message: 'Not enough points to redeem.' 
      });
      return;
    }
    throw error;
  }
});

// Wallet summary
app.get('/wallet/:customerId', (req: Request, res: Response) => {
  const { customerId } = req.params;

  const customer = customerService.getCustomer(customerId);
  if (!customer) {
    res.status(404).json({ error: 'CUSTOMER_NOT_FOUND', message: 'Customer does not exist' });
    return;
  }

  res.json({
    customerId,
    balancePoints: pointsService.getBalance(customerId),
    todayEarnedPoints: pointsService.getTodayEarnedPoints(customerId),
    lifetimeEarnedPoints: pointsService.getLifetimeEarnedPoints(customerId),
    lifetimeRedeemedPoints: pointsService.getLifetimeRedeemedPoints(customerId),
  });
});

export default app;
