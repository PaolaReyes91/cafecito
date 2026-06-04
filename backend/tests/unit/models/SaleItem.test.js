import { startDb, stopDb, clearDb } from '../../helpers/dbHelper.js';
import SaleItem from '../../../src/models/SaleItem.js';
import { createProduct } from '../../helpers/factories.js';
import { createSaleWithItems } from '../../helpers/factories.js';

beforeAll(async () => startDb());
afterEach(async () => clearDb());
afterAll(async () => stopDb());

describe('SaleItem Model', () => {
  // U15
  test('pre-save hook calculates lineTotal', async () => {
    const product = await createProduct({ price: 50 });
    const item = await SaleItem.create({
      saleId: '000000000000000000000001',
      productId: product._id,
      productNameSnapshot: product.name,
      unitPriceSnapshot: 50,
      quantity: 3,
    });
    expect(item.lineTotal).toBe(150);
  });

  // U16
  test('rejects quantity < 1', async () => {
    const product = await createProduct();
    await expect(
      SaleItem.create({
        saleId: '000000000000000000000001',
        productId: product._id,
        quantity: 0,
      })
    ).rejects.toThrow();
  });

  test('allows quantity of 1', async () => {
    const product = await createProduct({ price: 30 });
    const item = await SaleItem.create({
      saleId: '000000000000000000000001',
      productId: product._id,
      productNameSnapshot: product.name,
      unitPriceSnapshot: 30,
      quantity: 1,
    });
    expect(item.lineTotal).toBe(30);
  });

  test('createSaleWithItems creates related items', async () => {
    const p1 = await createProduct({ price: 100 });
    const p2 = await createProduct({ price: 50 });
    const sale = await createSaleWithItems({
      products: [
        { ...p1, qty: 2 },
        { ...p2, qty: 1 },
      ],
    });
    const items = await SaleItem.find({ saleId: sale._id });
    expect(items).toHaveLength(2);
  });
});
