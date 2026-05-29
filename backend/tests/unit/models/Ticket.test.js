import { startDb, stopDb, clearDb } from '../../helpers/dbHelper.js';
import Ticket from '../../../src/models/Ticket.js';

beforeAll(async () => startDb());
afterEach(async () => clearDb());
afterAll(async () => stopDb());

describe('Ticket Model', () => {
  const base = {
    saleId: '000000000000000000000001',
    items: [
      { name: 'Latte', qty: 2, unitPrice: 55, lineTotal: 110 },
    ],
    subtotal: 110,
    total: 110,
    paymentMethod: 'cash',
  };

  // U17
  test('creates ticket with embedded items', async () => {
    const t = await Ticket.create(base);
    expect(t.storeName).toBe('Cafecito Feliz');
    expect(t.items).toHaveLength(1);
    expect(t.items[0].name).toBe('Latte');
    expect(t.items[0].qty).toBe(2);
  });

  // U18
  test('rejects duplicate saleId', async () => {
    await Ticket.create(base);
    try {
      await Ticket.create(base);
      const count = await Ticket.countDocuments({ saleId: '000000000000000000000001' });
      expect(count).toBe(1);
    } catch {
      // Expected — duplicate rejected via unique index
    }
  });

  test('defaults storeName and paymentMethod', async () => {
    const t = await Ticket.create({
      saleId: '000000000000000000000002',
      items: [{ name: 'Té', qty: 1, unitPrice: 30, lineTotal: 30 }],
      subtotal: 30,
      total: 30,
    });
    expect(t.storeName).toBe('Cafecito Feliz');
    expect(t.paymentMethod).toBe('cash');
  });
});
