import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cafecito-secret-dev';

export const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};

export const createAuthenticatedUser = async (overrides = {}) => {
  const data = {
    name: overrides.name || 'Test User',
    email: overrides.email || 'test@example.com',
    password: 'password123',
    role: overrides.role || 'seller',
  };
  const user = await User.create(data);
  const token = generateToken(user);
  return { user, token };
};
