import { startDb, stopDb, clearDb } from '../../helpers/dbHelper.js';
import Product from '../../../src/models/Product.js';

beforeAll(async () => startDb());
afterEach(async () => clearDb());
afterAll(async () => stopDb());

describe('Product Model', () => {
  const validProduct = { name: 'Latte', price: 55, stock: 10 };

  // U7
  test('creates a valid product', async () => {
    const p = await Product.create(validProduct);
    expect(p.name).toBe('Latte');
    expect(p.price).toBe(55);
    expect(p.stock).toBe(10);
  });

  // U8
  test('rejects price <= 0', async () => {
    await expect(Product.create({ ...validProduct, price: 0 })).rejects.toThrow();
    await expect(Product.create({ ...validProduct, price: -1 })).rejects.toThrow();
  });

  // U9
  test('rejects negative stock', async () => {
    await expect(Product.create({ ...validProduct, stock: -1 })).rejects.toThrow();
  });

  // U10
  test('rejects empty name', async () => {
    await expect(Product.create({ ...validProduct, name: '' })).rejects.toThrow();
  });

  test('allows stock of 0', async () => {
    const p = await Product.create({ ...validProduct, stock: 0 });
    expect(p.stock).toBe(0);
  });

  test('trims name', async () => {
    const p = await Product.create({ ...validProduct, name: '  Capuccino  ' });
    expect(p.name).toBe('Capuccino');
  });
});
