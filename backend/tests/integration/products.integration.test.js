import supertest from 'supertest';
import { createApp } from '../helpers/appHelper.js';
import { startDb, stopDb, clearDb } from '../helpers/dbHelper.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';
import { createProduct } from '../helpers/factories.js';

const app = createApp();
const request = supertest(app);

let adminToken;
let sellerToken;

beforeAll(async () => { await startDb(); });
afterAll(async () => stopDb());
beforeEach(async () => {
  await clearDb();
  const admin = await createAuthenticatedUser({ role: 'admin', email: 'admin@products.test' });
  adminToken = admin.token;
  const seller = await createAuthenticatedUser({ role: 'seller', email: 'seller@products.test' });
  sellerToken = seller.token;
});

describe('GET /api/products', () => {
  // I8
  test('returns empty list when no products', async () => {
    const res = await request.get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  // I9
  test('returns paginated products', async () => {
    await Promise.all([
      createProduct({ name: 'Product A' }),
      createProduct({ name: 'Product B' }),
      createProduct({ name: 'Product C' }),
    ]);

    const res = await request.get('/api/products').query({ limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(3);
  });

  // I10
  test('search by query string', async () => {
    await createProduct({ name: 'Café Latte' });
    await createProduct({ name: 'Té Verde' });

    const res = await request.get('/api/products').query({ q: 'café' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Café Latte');
  });

  test('returns message when search has no results', async () => {
    const res = await request.get('/api/products').query({ q: 'zzznonexistent' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.message).toContain('zzznonexistent');
  });
});

describe('GET /api/products/:id', () => {
  // I11
  test('returns product by id', async () => {
    const product = await createProduct({ name: 'Single Product' });

    const res = await request.get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Single Product');
  });

  // I12
  test('returns 404 for non-existent product', async () => {
    const res = await request.get('/api/products/000000000000000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('POST /api/products (admin only)', () => {
  // I13
  test('admin can create product', async () => {
    const res = await request
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Product', price: 25, stock: 10 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Product');
  });

  // I14
  test('seller cannot create product', async () => {
    const res = await request
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Should Fail', price: 10, stock: 5 });

    expect(res.status).toBe(403);
  });

  // I15
  test('unauthenticated cannot create product', async () => {
    const res = await request
      .post('/api/products')
      .send({ name: 'No Auth', price: 10, stock: 5 });

    expect(res.status).toBe(401);
  });

  test('rejects validation errors', async () => {
    const res = await request
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '', price: 0, stock: -1 });

    expect(res.status).toBe(422);
    expect(res.body.details).toBeDefined();
  });
});

describe('PUT /api/products/:id (admin only)', () => {
  // I16
  test('admin can update product', async () => {
    const product = await createProduct({ name: 'Before Update', price: 10, stock: 5 });

    const res = await request
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'After Update', price: 20 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('After Update');
    expect(res.body.price).toBe(20);
  });

  test('seller cannot update product', async () => {
    const product = await createProduct({ name: 'Protected', price: 10, stock: 5 });
    const res = await request
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/products/:id (admin only)', () => {
  // I17
  test('admin can delete product', async () => {
    const product = await createProduct({ name: 'To Delete', price: 10, stock: 5 });

    const res = await request
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // I18
  test('returns 404 for non-existent product', async () => {
    const res = await request
      .delete('/api/products/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
