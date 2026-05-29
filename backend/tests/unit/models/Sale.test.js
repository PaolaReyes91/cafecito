import { startDb, stopDb, clearDb } from '../../helpers/dbHelper.js';
import Sale from '../../../src/models/Sale.js';

beforeAll(async () => startDb());
afterEach(async () => clearDb());
afterAll(async () => stopDb());

describe('Sale Model', () => {
  // U13
  test('creates a sale with defaults', async () => {
    const s = await Sale.create({
      subtotal: 100,
      total: 100,
    });
    expect(s.paymentMethod).toBe('cash');
    expect(s.discountPercent).toBe(0);
    expect(s.discountAmount).toBe(0);
    expect(s.subtotal).toBe(100);
    expect(s.total).toBe(100);
    expect(s.customerId).toBeNull();
  });

  // U14
  test('rejects discountPercent > 100', async () => {
    await expect(
      Sale.create({ subtotal: 100, total: 0, discountPercent: 150 })
    ).rejects.toThrow();
  });

  test('rejects negative discountPercent', async () => {
    await expect(
      Sale.create({ subtotal: 100, total: 100, discountPercent: -5 })
    ).rejects.toThrow();
  });
});
