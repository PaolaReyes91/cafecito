import supertest from 'supertest';
import { createApp } from '../helpers/appHelper.js';
import { startDb, stopDb, clearDb } from '../helpers/dbHelper.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';
import { createProduct } from '../helpers/factories.js';

const app = createApp();
const request = supertest(app);

let userToken;

beforeAll(async () => { await startDb(); });
afterAll(async () => stopDb());
beforeEach(async () => {
  await clearDb();
  const auth = await createAuthenticatedUser({ email: 'tickets@integration.test' });
  userToken = auth.token;
});

const createSale = async ({ productPrice = 10, quantity = 2 } = {}) => {
  const product = await createProduct({ price: productPrice, stock: 10 });
  const saleRes = await request
    .post('/api/sales')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      payment_method: 'cash',
      items: [{ product_id: product._id, quantity }],
    });

  return { sale: saleRes.body, product };
};

describe('POST /api/tickets/generate/:saleId', () => {
  test('generates ticket for existing sale', async () => {
    const { sale } = await createSale({ productPrice: 15, quantity: 2 });

    const res = await request
      .post(`/api/tickets/generate/${sale.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(201);
    expect(res.body.sale_id).toBe(sale.id);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(30);
  });

  test('returns 404 when sale does not exist', async () => {
    const res = await request
      .post('/api/tickets/generate/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  test('returns 200 when ticket already exists', async () => {
    const { sale } = await createSale({ productPrice: 12, quantity: 1 });

    const first = await request
      .post(`/api/tickets/generate/${sale.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(first.status).toBe(201);

    const second = await request
      .post(`/api/tickets/generate/${sale.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(second.status).toBe(200);
    expect(second.body.sale_id).toBe(sale.id);
    expect(second.body.items).toEqual(first.body.items);
  });
});

describe('GET /api/tickets/sale/:saleId', () => {
  test('returns ticket for existing sale', async () => {
    const { sale } = await createSale({ productPrice: 25, quantity: 1 });
    await request.post(`/api/tickets/generate/${sale.id}`).set('Authorization', `Bearer ${userToken}`);

    const res = await request
      .get(`/api/tickets/sale/${sale.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.sale_id).toBe(sale.id);
    expect(res.body.items[0].qty).toBe(1);
  });

  test('returns 404 when ticket does not exist', async () => {
    const res = await request
      .get('/api/tickets/sale/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/tickets', () => {
  test('returns ticket list', async () => {
    const saleA = await createSale({ productPrice: 8, quantity: 1 });
    const saleB = await createSale({ productPrice: 6, quantity: 2 });

    await request.post(`/api/tickets/generate/${saleA.sale.id}`).set('Authorization', `Bearer ${userToken}`);
    await request.post(`/api/tickets/generate/${saleB.sale.id}`).set('Authorization', `Bearer ${userToken}`);

    const res = await request
      .get('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});
