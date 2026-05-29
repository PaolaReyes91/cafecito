import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../../src/middleware/auth.js';
import { startDb, stopDb } from '../../helpers/dbHelper.js';
import { createAuthenticatedUser } from '../../helpers/authHelper.js';

const mockReq = (overrides = {}) => ({
  headers: {},
  baseUrl: '',
  route: { path: '' },
  method: 'GET',
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  let realToken;

  beforeAll(async () => {
    await startDb();
    const { token } = await createAuthenticatedUser({ role: 'admin' });
    realToken = token;
  });

  afterAll(async () => stopDb());

  // U19
  test('calls next() with valid token and existing user', async () => {
    const req = mockReq({ headers: { authorization: `Bearer ${realToken}` } });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe('admin');
  });

  // U20
  test('returns 401 when no authorization header', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // U21
  test('returns 401 with invalid token', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer obviously-invalid' } });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // U22
  test('returns 401 when token is for deleted user', async () => {
    const { user } = await createAuthenticatedUser({ email: 'todelete@test.com' });
    const scopedToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'cafecito-secret-dev'
    );
    await user.deleteOne();

    const req = mockReq({ headers: { authorization: `Bearer ${scopedToken}` } });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is missing after Bearer', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer ' } });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('authorize middleware', () => {
  // U23
  test('calls next() when user role is in allowed roles', () => {
    const req = mockReq({ user: { role: 'admin' } });
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // U24
  test('returns 403 when user role is not allowed', () => {
    const req = mockReq({ user: { role: 'seller' } });
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // U25
  test('passes when multiple roles are specified and user has one', () => {
    const req = mockReq({ user: { role: 'seller' } });
    const res = mockRes();
    const next = jest.fn();

    authorize('admin', 'seller')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('returns 403 with proper error message', () => {
    const req = mockReq({ user: { role: 'seller' } });
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Insufficient permissions' })
    );
  });
});
