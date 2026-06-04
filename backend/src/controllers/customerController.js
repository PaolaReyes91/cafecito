import Customer from '../models/Customer.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cafecito-secret-dev';

const generateToken = (customer) => {
  return jwt.sign({ id: customer._id, role: 'customer' }, JWT_SECRET, {
    expiresIn: '8h',
  });
};

export const registerCustomer = async (req, res) => {
  try {
    const { name, phone_or_email, phoneOrEmail, password } = req.body;
    const emailOrPhone = phone_or_email || phoneOrEmail;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: [{ field: 'name', message: 'Name must be at least 2 characters' }] 
      });
    }
    
    if (!emailOrPhone || typeof emailOrPhone !== 'string') {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: [{ field: 'phone_or_email', message: 'Phone or email is required' }] 
      });
    }
    
    if (!password || password.length < 6) {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: [{ field: 'password', message: 'Password must be at least 6 characters' }] 
      });
    }
    
    const existing = await Customer.findOne({ phoneOrEmail: emailOrPhone.trim() });
    if (existing) {
      return res.status(400).json({
        error: 'Customer already registered with this email or phone',
        details: [{ field: 'phone_or_email', message: 'This email or phone is already in use' }],
      });
    }

    const customer = await Customer.create({ 
      name: name.trim(), 
      phoneOrEmail: emailOrPhone.trim(),
      password 
    });
    
    const token = generateToken(customer);
    res.status(201).json({
      token,
      customer: { 
        id: customer._id, 
        name: customer.name, 
        phoneOrEmail: customer.phoneOrEmail,
        role: 'customer'
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const loginCustomer = async (req, res) => {
  try {
    const { phone_or_email, phoneOrEmail, password } = req.body;
    const emailOrPhone = phone_or_email || phoneOrEmail;
    
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Phone/email and password are required' });
    }
    
    const customer = await Customer.findOne({ phoneOrEmail: emailOrPhone }).select('+password');
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(customer);
    res.json({
      token,
      customer: { 
        id: customer._id, 
        name: customer.name, 
        phoneOrEmail: customer.phoneOrEmail,
        role: 'customer'
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getCustomerProfile = async (req, res) => {
  res.json({ customer: req.user });
};
