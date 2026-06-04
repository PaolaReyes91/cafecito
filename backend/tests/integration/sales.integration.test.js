import supertest from 'supertest';
import { createApp } from '../helpers/appHelper.js';
import { startDb, stopDb, clearDb } from '../helpers/dbHelper.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';
import { createProduct, createCustomer } from '../helpers/factories.js';
import Customer from '../../src/models/Customer.js';
import Product from '../../src/models/Product.js';

const app = createApp();
const request = supertest(app);

let userToken;

beforeAll(async () => { await startDb(); });
afterAll(async () => stopDb());
beforeEach(async () => {
  await clearDb();
  const auth = await createAuthenticatedUser({ email: 'sales@integration.test' });
  userToken = auth.token;
});

describe('POST /api/sales', () => {
  test('creates sale without customer and returns ticket', async () => {
    const product = await createProduct({ price: 10, stock: 5 });

    const res = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        payment_method: 'cash',
        items: [{ product_id: product._id, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(20);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.customer_id).toBeNull();
  });

  test('creates sale with customer and applies discount', async () => {
    const product = await createProduct({ price: 100, stock: 10 });
    const customer = await createCustomer({ purchasesCount: 5 });

    const res = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        customer_id: customer._id,
        payment_method: 'card',
        items: [{ product_id: product._id, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.discount.percentage).toBe(0.1);
    expect(res.body.total).toBe(180);
    expect(res.body.ticket.discount).toContain('10%');

    const refreshedCustomer = await Customer.findById(customer._id);
    expect(refreshedCustomer.purchasesCount).toBe(6);
  });

  test('returns 400 when stock is insufficient', async () => {
    const product = await createProduct({ price: 15, stock: 1 });

    const res = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        payment_method: 'cash',
        items: [{ product_id: product._id, quantity: 2 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Insufficient stock/i);
  });

  test('returns 400 when product does not exist', async () => {
    const res = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        payment_method: 'cash',
        items: [{ product_id: '000000000000000000000000', quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Product not found/i);
  });

  test('returns 422 when items array is empty', async () => {
    const res = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ payment_method: 'cash', items: [] });

    expect(res.status).toBe(422);
    expect(res.body.details[0].field).toBe('items');
  });

  test('returns 422 for invalid payment method', async () => {
    const product = await createProduct({ price: 20, stock: 5 });

    const res = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        payment_method: 'bitcoin',
        items: [{ product_id: product._id, quantity: 1 }],
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Validation failed/i);
  });

  test('decrements product stock after sale', async () => {
    const product = await createProduct({ price: 10, stock: 5 });

    const res = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        payment_method: 'cash',
        items: [{ product_id: product._id, quantity: 3 }],
      });

    expect(res.status).toBe(201);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(2);
  });

  test('returns 401 when creating sale without token', async () => {
    const product = await createProduct({ price: 10, stock: 5 });

    const res = await request.post('/api/sales').send({
      payment_method: 'cash',
      items: [{ product_id: product._id, quantity: 1 }],
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/sales', () => {
  test('returns paginated sales list', async () => {
    const product1 = await createProduct({ price: 5, stock: 10 });
    const product2 = await createProduct({ price: 7, stock: 10 });

    await request.post('/api/sales').set('Authorization', `Bearer ${userToken}`).send({
      payment_method: 'cash',
      items: [{ product_id: product1._id, quantity: 1 }],
    });
    await request.post('/api/sales').set('Authorization', `Bearer ${userToken}`).send({
      payment_method: 'card',
      items: [{ product_id: product2._id, quantity: 2 }],
    });

    const res = await request
      .get('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ page: 1, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
  });
});

describe('GET /api/sales/:id', () => {
  test('returns sale by id', async () => {
    const product = await createProduct({ price: 20, stock: 5 });

    const createRes = await request
      .post('/api/sales')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        payment_method: 'cash',
        items: [{ product_id: product._id, quantity: 2 }],
      });

    const res = await request
      .get(`/api/sales/${createRes.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.items).toHaveLength(1);
  });

  test('returns 404 for non-existent sale', async () => {
    const res = await request
      .get('/api/sales/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });
});
