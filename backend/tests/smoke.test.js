import { startDb, stopDb, clearDb } from './helpers/dbHelper.js';
import User from '../src/models/User.js';
import { buildUser, createUser } from './helpers/factories.js';

beforeAll(async () => startDb());
afterEach(async () => clearDb());
afterAll(async () => stopDb());

describe('Smoke — Infrastructure', () => {
  test('mongodb-memory-server connects and creates a document', async () => {
    await createUser({ name: 'Smoke Test', email: 'smoke@test.com', role: 'admin' });
    const count = await User.countDocuments();
    expect(count).toBe(1);
  });

  test('buildUser produces correct shape', () => {
    const data = buildUser({ role: 'admin' });
    expect(data).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
      role: 'admin',
    });
  });
});
