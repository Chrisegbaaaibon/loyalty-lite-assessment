import { Customer } from '../types';

export class CustomerService {
  private customers = new Map<string, Customer>();
  private phoneIndex = new Map<string, string>();
  private idCounter = 1;

  createCustomer(phone: string, email: string): Customer {
    const existingId = this.phoneIndex.get(phone);
    if (existingId) {
      return this.customers.get(existingId)!;
    }

    const customer: Customer = {
      id: `cust_${this.idCounter++}`,
      phone,
      email,
      createdAt: new Date().toISOString(),
    };

    this.customers.set(customer.id, customer);
    this.phoneIndex.set(phone, customer.id);
    return customer;
  }

  getCustomer(id: string): Customer | undefined {
    return this.customers.get(id);
  }
}
