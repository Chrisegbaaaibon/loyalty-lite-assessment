import { IdempotencyRecord } from '../types';

export class IdempotencyService {
  private records = new Map<string, IdempotencyRecord>();

  getKey(method: string, path: string, body: any): string {
    return `${method}:${path}:${JSON.stringify(body)}`;
  }

  check(idempotencyKey: string, method: string, path: string, body: any): IdempotencyRecord | null {
    const record = this.records.get(idempotencyKey);
    if (!record) return null;

    const currentKey = this.getKey(method, path, body);
    const recordKey = this.getKey(record.method, record.path, JSON.parse(record.body));

    if (currentKey !== recordKey) {
      throw new Error('IDEMPOTENCY_CONFLICT');
    }

    return record;
  }

  store(idempotencyKey: string, method: string, path: string, body: any, response: any): void {
    this.records.set(idempotencyKey, {
      method,
      path,
      body: JSON.stringify(body),
      response,
    });
  }
}
