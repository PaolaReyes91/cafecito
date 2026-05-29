import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cafecito-secret-dev';

const ENDPOINT_ACTIONS = {
  '/api/products:POST': 'create products',
  '/api/products/:id:PUT': 'update products',
  '/api/products/:id:DELETE': 'delete products',
};

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization token',
      });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization token',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization token',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization token',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const routeKey = `${req.baseUrl}${req.route?.path}:${req.method}`;
      const action = ENDPOINT_ACTIONS[routeKey] || 'perform this action';
      const roleLabels = { admin: 'admins', seller: 'sellers' };
      const roleText = roles.map(r => roleLabels[r] || r).join(' or ');
      const message = `Only ${roleText} can ${action}`;
      return res.status(403).json({ error: 'Insufficient permissions', message });
    }
    next();
  };
};
