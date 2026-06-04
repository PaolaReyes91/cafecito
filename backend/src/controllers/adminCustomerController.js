import Customer from '../models/Customer.js';
import crypto from 'crypto';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+\d{7,15}$/;

const isValidEmailOrPhone = (value) => EMAIL_REGEX.test(value) || PHONE_REGEX.test(value);

const generateTemporaryPassword = () => {
  return crypto.randomBytes(4).toString('hex') + Math.random().toString(36).slice(-4);
};

export const createCustomer = async (req, res) => {
  try {
    const { name, phone_or_email, password } = req.body;
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'name must be between 2 and 100 characters' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'name must be between 2 and 100 characters' });
    }
    if (!phone_or_email || typeof phone_or_email !== 'string' || !isValidEmailOrPhone(phone_or_email.trim())) {
      errors.push({
        field: 'phone_or_email',
        message: 'Must be a valid email (user@example.com) or phone number (+56912345678)',
      });
    }
    if (errors.length > 0) {
      return res.status(422).json({ error: 'Validation failed', details: errors });
    }

    const trimmedPhone = phone_or_email.trim();
    const existing = await Customer.findOne({ phoneOrEmail: trimmedPhone });
    if (existing) {
      return res.status(400).json({
        error: 'Customer already exists',
        details: [
          {
            field: 'phone_or_email',
            message: 'A customer with this email already exists',
            existing_customer_id: existing._id,
          },
        ],
      });
    }

    const customerPassword = password || generateTemporaryPassword();
    const customer = await Customer.create({ 
      name: name.trim(), 
      phoneOrEmail: trimmedPhone,
      password: customerPassword
    });
    res.status(201).json({
      id: customer._id,
      name: customer.name,
      phone_or_email: customer.phoneOrEmail,
      purchases_count: customer.purchasesCount,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    });
  } catch (error) {
    res.status(422).json({
      error: 'Validation failed',
      details: [{ field: 'name', message: error.message }],
    });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { phoneOrEmail: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const response = {
      data: customers.map((c) => ({
        id: c._id,
        name: c.name,
        phone_or_email: c.phoneOrEmail,
        purchases_count: c.purchasesCount,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
    };
    if (q && total === 0) {
      response.message = `No customers found matching '${q}'`;
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found', id: req.params.id });
    }
    res.json({
      id: customer._id,
      name: customer.name,
      phone_or_email: customer.phoneOrEmail,
      purchases_count: customer.purchasesCount,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { name, phone_or_email } = req.body;
    const errors = [];
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.length > 100)) {
      errors.push({ field: 'name', message: 'name must be between 2 and 100 characters' });
    }
    if (phone_or_email !== undefined && (typeof phone_or_email !== 'string' || !isValidEmailOrPhone(phone_or_email.trim()))) {
      errors.push({
        field: 'phone_or_email',
        message: 'Must be a valid email (user@example.com) or phone number (+56912345678)',
      });
    }
    if (errors.length > 0) {
      return res.status(422).json({ error: 'Validation failed', details: errors });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone_or_email !== undefined) {
      const trimmed = phone_or_email.trim();
      const existing = await Customer.findOne({ phoneOrEmail: trimmed, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({
          error: 'Customer already exists',
          details: [
            {
              field: 'phone_or_email',
              message: 'A customer with this email already exists',
              existing_customer_id: existing._id,
            },
          ],
        });
      }
      updateData.phoneOrEmail = trimmed;
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found', id: req.params.id });
    }
    res.json({
      id: customer._id,
      name: customer.name,
      phone_or_email: customer.phoneOrEmail,
      purchases_count: customer.purchasesCount,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    });
  } catch (error) {
    res.status(422).json({
      error: 'Validation failed',
      details: [{ field: 'name', message: error.message }],
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found', id: req.params.id });
    }
    res.json({ message: 'Customer deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
