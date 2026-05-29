import supertest from 'supertest';
import { createApp } from '../helpers/appHelper.js';
import { startDb, stopDb, clearDb } from '../helpers/dbHelper.js';
import User from '../../src/models/User.js';

const app = createApp();
const request = supertest(app);

describe('POST /api/auth/register', () => {
  beforeAll(async () => { await startDb(); await clearDb(); });
  afterAll(async () => stopDb());
  afterEach(async () => clearDb());

  // I1
  test('registers user and returns token + user', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'New User',
      email: 'new@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('new@test.com');
    expect(res.body.user.role).toBe('seller');
  });

  // I2
  test('rejects duplicate email', async () => {
    await User.create({ name: 'Existing', email: 'dup@test.com', password: 'password123' });

    const res = await request.post('/api/auth/register').send({
      name: 'Dup',
      email: 'dup@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('registers admin role when specified', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => { await startDb(); await clearDb(); });
  afterAll(async () => stopDb());

  beforeEach(async () => {
    await User.create({ name: 'Login User', email: 'login@test.com', password: 'password123' });
  });
  afterEach(async () => clearDb());

  // I3
  test('login with valid credentials returns token', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
  });

  // I4
  test('rejects wrong password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  // I5
  test('rejects non-existent email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
  });

  // I6
  test('rejects missing email and password', async () => {
    const res = await request.post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });
});

describe('GET /api/auth/me', () => {
  beforeAll(async () => { await startDb(); await clearDb(); });
  afterAll(async () => stopDb());
  afterEach(async () => clearDb());

  // I7
  test('returns authenticated user', async () => {
    const user = await User.create({ name: 'Me User', email: 'me@test.com', password: 'password123' });
    const token = (await request.post('/api/auth/login').send({ email: 'me@test.com', password: 'password123' })).body.token;

    const res = await request.get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@test.com');
  });

  test('returns 401 without token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
