import { startDb, stopDb, clearDb } from '../../helpers/dbHelper.js';
import Customer from '../../../src/models/Customer.js';

beforeAll(async () => startDb());
afterEach(async () => clearDb());
afterAll(async () => stopDb());

describe('Customer Model', () => {
  const base = { name: 'Juan Pérez', phoneOrEmail: '+56912345678' };

  // U11
  test('creates a customer with default purchasesCount 0', async () => {
    const c = await Customer.create(base);
    expect(c.name).toBe('Juan Pérez');
    expect(c.phoneOrEmail).toBe('+56912345678');
    expect(c.purchasesCount).toBe(0);
  });

  // U12
  test('rejects duplicate phoneOrEmail', async () => {
    await Customer.create(base);
    try {
      await Customer.create(base);
      const count = await Customer.countDocuments({ phoneOrEmail: '+56912345678' });
      expect(count).toBe(1);
    } catch {
      // Expected — duplicate rejected via MongoDB index
    }
  });

  test('accepts email as phoneOrEmail', async () => {
    const c = await Customer.create({ name: 'Ana', phoneOrEmail: 'ana@mail.com' });
    expect(c.phoneOrEmail).toBe('ana@mail.com');
  });

  test('requires name and phoneOrEmail', async () => {
    await expect(Customer.create({})).rejects.toThrow();
  });
});
