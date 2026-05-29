import supertest from 'supertest';
import { createApp } from '../helpers/appHelper.js';
import { startDb, stopDb, clearDb } from '../helpers/dbHelper.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';
import { buildCustomer } from '../helpers/factories.js';

const app = createApp();
const request = supertest(app);

let userToken;

beforeAll(async () => { await startDb(); });
afterAll(async () => stopDb());
beforeEach(async () => {
  await clearDb();
  const auth = await createAuthenticatedUser({ email: 'user@customers.test' });
  userToken = auth.token;
});

describe('POST /api/customers', () => {
  // I19
  test('creates customer with valid data', async () => {
    const res = await request
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Juan Pérez', phone_or_email: 'juan@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Juan Pérez');
    expect(res.body.purchases_count).toBe(0);
  });

  // I20
  test('rejects duplicate phone_or_email', async () => {
    await request
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'First', phone_or_email: 'dup@example.com' });

    const res = await request
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Second', phone_or_email: 'dup@example.com' });

    expect(res.status).toBe(400);
  });

  // I21
  test('rejects missing required fields', async () => {
    const res = await request
      .post('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  // I22
  test('rejects unauthenticated request', async () => {
    const res = await request
      .post('/api/customers')
      .send({ name: 'No Auth', phone_or_email: 'noauth@test.com' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/customers', () => {
  // I23
  test('returns paginated customers', async () => {
    await request.post('/api/customers').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'C1', phone_or_email: 'c1@test.com' });
    await request.post('/api/customers').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'C2', phone_or_email: 'c2@test.com' });

    const res = await request
      .get('/api/customers')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('searches by name or phone_or_email', async () => {
    await request.post('/api/customers').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'María García', phone_or_email: 'maria@test.com' });
    await request.post('/api/customers').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Pedro López', phone_or_email: 'pedro@test.com' });

    const res = await request
      .get('/api/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ q: 'maría' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/customers/:id', () => {
  // I24
  test('returns customer by id', async () => {
    const create = await request.post('/api/customers').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Find Me', phone_or_email: 'findme@test.com' });

    const res = await request
      .get(`/api/customers/${create.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Find Me');
  });

  // I25
  test('returns 404 for non-existent customer', async () => {
    const res = await request
      .get('/api/customers/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/customers/:id', () => {
  // I26
  test('updates customer name', async () => {
    const create = await request.post('/api/customers').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Old Name', phone_or_email: 'update@test.com' });

    const res = await request
      .put(`/api/customers/${create.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  // I27
  test('returns 404 for non-existent customer', async () => {
    const res = await request
      .put('/api/customers/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/customers/:id', () => {
  // I28
  test('deletes customer', async () => {
    const create = await request.post('/api/customers').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'To Delete', phone_or_email: 'todelete@test.com' });

    const res = await request
      .delete(`/api/customers/${create.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // I29
  test('returns 404 for non-existent customer', async () => {
    const res = await request
      .delete('/api/customers/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });
});

test('unauthenticated request returns 401', async () => {
  const res = await request.get('/api/customers');
  expect(res.status).toBe(401);
});
