import { Request } from 'express';

export interface Customer {
  id: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  amountMinor: number;
  points: number;
  createdAt: string;
}

export interface Redemption {
  id: string;
  customerId: string;
  points: number;
  createdAt: string;
}

export interface IdempotencyRecord {
  method: string;
  path: string;
  body: string;
  response: any;
}

export interface IdempotencyRequest extends Request {
  idempotencyKey: string;
}

export interface EarnRequest {
  customerId: string;
  amountMinor: number;
  currency: string;
}

export interface RedeemRequest {
  customerId: string;
  points: number;
}
