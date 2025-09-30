import { Transaction, Redemption } from '../types';
import { isToday } from '../utils/dateUtils';

export class PointsService {
  private transactions: Transaction[] = [];
  private redemptions: Redemption[] = [];
  private txCounter = 1;
  private redemptionCounter = 1;

  private readonly DAILY_CAP = 5000;
  private readonly EARN_RATE = 100; // 1 point per 100 kobo

  earnPoints(customerId: string, amountMinor: number): { 
    transaction: Transaction; 
    creditedPoints: number; 
    remainingDailyAllowance: number 
  } {
    const requestedPoints = Math.floor(amountMinor / this.EARN_RATE);
    const todayEarned = this.getTodayEarnedPoints(customerId);
    const remainingAllowance = Math.max(0, this.DAILY_CAP - todayEarned);
    const creditedPoints = Math.min(requestedPoints, remainingAllowance);

    const transaction: Transaction = {
      id: `tx_${String(this.txCounter++).padStart(3, '0')}`,
      customerId,
      amountMinor,
      points: creditedPoints,
      createdAt: new Date().toISOString(),
    };

    this.transactions.push(transaction);

    return {
      transaction,
      creditedPoints,
      remainingDailyAllowance: remainingAllowance - creditedPoints,
    };
  }

  redeemPoints(customerId: string, points: number): { 
    redemption: Redemption; 
    newBalance: number 
  } {
    const currentBalance = this.getBalance(customerId);
    
    if (currentBalance < points) {
      throw new Error('INSUFFICIENT_POINTS');
    }

    const redemption: Redemption = {
      id: `red_${String(this.redemptionCounter++).padStart(3, '0')}`,
      customerId,
      points,
      createdAt: new Date().toISOString(),
    };

    this.redemptions.push(redemption);

    return {
      redemption,
      newBalance: currentBalance - points,
    };
  }

  getBalance(customerId: string): number {
    const earned = this.transactions
      .filter(tx => tx.customerId === customerId)
      .reduce((sum, tx) => sum + tx.points, 0);

    const redeemed = this.redemptions
      .filter(red => red.customerId === customerId)
      .reduce((sum, red) => sum + red.points, 0);

    return earned - redeemed;
  }

  getTodayEarnedPoints(customerId: string): number {
    return this.transactions
      .filter(tx => tx.customerId === customerId && isToday(new Date(tx.createdAt)))
      .reduce((sum, tx) => sum + tx.points, 0);
  }

  getLifetimeEarnedPoints(customerId: string): number {
    return this.transactions
      .filter(tx => tx.customerId === customerId)
      .reduce((sum, tx) => sum + tx.points, 0);
  }

  getLifetimeRedeemedPoints(customerId: string): number {
    return this.redemptions
      .filter(red => red.customerId === customerId)
      .reduce((sum, red) => sum + red.points, 0);
  }
}
