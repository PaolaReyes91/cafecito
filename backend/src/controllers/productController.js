import Product from '../models/Product.js';

export const createProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'name is required' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'name must be at most 100 characters' });
    }
    if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
      errors.push({ field: 'price', message: 'price must be a number greater than 0' });
    }
    if (stock === undefined || stock === null || !Number.isInteger(stock) || stock < 0) {
      errors.push({ field: 'stock', message: 'stock must be an integer >= 0' });
    }
    if (errors.length > 0) {
      return res.status(422).json({ error: 'Validation failed', details: errors });
    }

    const product = await Product.create({ name: name.trim(), price, stock });
    res.status(201).json({
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    });
  } catch (error) {
    res.status(422).json({
      error: 'Validation failed',
      details: [{ field: 'name', message: error.message }],
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const errors = [];

    let pageNum = parseInt(page, 10);
    if (page !== undefined && (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum))) {
      errors.push({
        field: 'page',
        value: page,
        message: 'page must be a positive integer (greater than or equal to 1)',
      });
    }

    let limitNum = parseInt(limit, 10);
    if (limit !== undefined && (isNaN(limitNum) || limitNum < 1 || limitNum > 100 || !Number.isInteger(limitNum))) {
      errors.push({
        field: 'limit',
        value: limit,
        message: 'limit must be a positive integer between 1 and 100',
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid query parameter', details: errors });
    }

    pageNum = Math.max(1, pageNum || 1);
    limitNum = Math.min(100, Math.max(1, limitNum || 20));

    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const response = {
      data: products.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
    };
    if (q && total === 0) {
      response.message = `No products found matching '${q}'`;
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found', id: req.params.id });
    }
    res.json({
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const errors = [];
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.length > 100)) {
      errors.push({ field: 'name', message: 'name must be a string between 1 and 100 characters' });
    }
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      errors.push({ field: 'price', message: 'price must be a number greater than 0' });
    }
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      errors.push({ field: 'stock', message: 'stock must be an integer >= 0' });
    }
    if (errors.length > 0) {
      return res.status(422).json({ error: 'Validation failed', details: errors });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found', id: req.params.id });
    }
    res.json({
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    });
  } catch (error) {
    res.status(422).json({
      error: 'Validation failed',
      details: [{ field: 'name', message: error.message }],
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found', id: req.params.id });
    }
    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
