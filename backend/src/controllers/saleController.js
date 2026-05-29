import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import Ticket from '../models/Ticket.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { getDiscountPercent } from '../utils/discount.js';

const VALID_PAYMENT_METHODS = ['cash', 'card', 'transfer'];

const formatItems = (items) =>
  items.map((item) => ({
    product_id: item.productId?._id || item.productId,
    product_name: item.productNameSnapshot || item.productId?.name || '',
    quantity: item.quantity,
    unit_price: item.unitPriceSnapshot || 0,
    line_total: item.lineTotal || 0,
  }));

const formatTicket = (sale, formattedItems) => ({
  sale_id: sale._id,
  timestamp: sale.createdAt || new Date(),
  store_name: 'Cafecito Feliz',
  items: formattedItems.map((i) => ({
    name: i.product_name,
    qty: i.quantity,
    unit_price: i.unit_price,
    line_total: i.line_total,
  })),
  subtotal: sale.subtotal,
  discount: `${sale.discountPercent}% (-$${sale.discountAmount.toFixed(2)})`,
  total: sale.total,
  payment_method: sale.paymentMethod,
});

export const createSale = async (req, res) => {
  try {
    const { customer_id, payment_method, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(422).json({
        error: 'Validation failed',
        details: [
          { field: 'items', message: 'items cannot be empty (minimum 1 item required)' },
        ],
      });
    }

    const itemsValidation = [];
    items.forEach((item, i) => {
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) {
        itemsValidation.push({
          field: `items[${i}].quantity`,
          message: 'quantity must be a positive integer (greater than or equal to 1)',
        });
      }
    });
    if (itemsValidation.length > 0) {
      return res.status(422).json({ error: 'Validation failed', details: itemsValidation });
    }

    if (payment_method && !VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(422).json({
        error: 'Validation failed',
        details: [
          {
            field: 'payment_method',
            message: 'payment_method must be one of: cash, card, transfer',
          },
        ],
      });
    }

    if (customer_id) {
      const customerExists = await Customer.findById(customer_id);
      if (!customerExists) {
        return res.status(400).json({
          error: 'Customer not found',
          details: [
            { customer_id, message: 'Customer does not exist' },
          ],
        });
      }
    }

    let subtotal = 0;
    const saleItemsData = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({
          error: 'Product not found',
          details: [
            { product_id: item.product_id, message: 'Product does not exist' },
          ],
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          details: [
            {
              product_id: product._id,
              product_name: product.name,
              available: product.stock,
              requested: item.quantity,
              message: `Only ${product.stock} available, requested ${item.quantity}`,
            },
          ],
        });
      }

      const unitPrice = product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      saleItemsData.push({
        productId: product._id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    let discPercent = 0;

    if (customer_id) {
      const customer = await Customer.findById(customer_id);
      if (customer) {
        discPercent = getDiscountPercent(customer.purchasesCount);
      }
    }

    const discountAmount = subtotal * (discPercent / 100);
    const total = subtotal - discountAmount;

    const sale = await Sale.create({
      customerId: customer_id || null,
      paymentMethod: payment_method || 'cash',
      subtotal,
      discountPercent: discPercent,
      discountAmount,
      total,
    });

    const saleItems = saleItemsData.map((item) => ({ ...item, saleId: sale._id }));
    await SaleItem.insertMany(saleItems);

    for (const item of items) {
      await Product.findByIdAndUpdate(item.product_id, { $inc: { stock: -item.quantity } });
    }

    if (customer_id) {
      await Customer.findByIdAndUpdate(customer_id, { $inc: { purchasesCount: 1 } });
    }

    const createdSale = await Sale.findById(sale._id);
    const formattedItems = formatItems(saleItemsData);
    const ticket = formatTicket(createdSale, formattedItems);

    res.status(201).json({
      id: sale._id,
      customer_id: customer_id || null,
      payment_method: sale.paymentMethod,
      items: formattedItems,
      subtotal: sale.subtotal,
      discount: { percentage: sale.discountPercent / 100, amount: sale.discountAmount },
      total: sale.total,
      ticket,
      created_at: sale.createdAt,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customerId', 'name phoneOrEmail');
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found', id: req.params.id });
    }

    const items = await SaleItem.find({ saleId: sale._id })
      .populate('productId', 'name price');

    const formattedItems = formatItems(items);
    const ticket = formatTicket(sale, formattedItems);

    res.json({
      id: sale._id,
      customer_name: sale.customerId?.name || null,
      customer_id: sale.customerId?._id || null,
      payment_method: sale.paymentMethod,
      items: formattedItems,
      subtotal: sale.subtotal,
      discount: { percentage: sale.discountPercent / 100, amount: sale.discountAmount },
      total: sale.total,
      ticket,
      created_at: sale.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const errors = [];

    let pageNum = parseInt(page, 10);
    if (page !== undefined && (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum))) {
      errors.push({ field: 'page', value: page, message: 'page must be a positive integer >= 1' });
    }
    let limitNum = parseInt(limit, 10);
    if (limit !== undefined && (isNaN(limitNum) || limitNum < 1 || limitNum > 100 || !Number.isInteger(limitNum))) {
      errors.push({ field: 'limit', value: limit, message: 'limit must be a positive integer between 1 and 100' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid query parameter', details: errors });
    }

    pageNum = Math.max(1, pageNum || 1);
    limitNum = Math.min(100, Math.max(1, limitNum || 20));

    const total = await Sale.countDocuments();
    const sales = await Sale.find()
      .populate('customerId', 'name phoneOrEmail')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const data = await Promise.all(
      sales.map(async (sale) => {
        const items = await SaleItem.find({ saleId: sale._id })
          .populate('productId', 'name price');
        const formattedItems = formatItems(items);
        const ticket = formatTicket(sale, formattedItems);
        return {
          id: sale._id,
          customer_name: sale.customerId?.name || null,
          customer_id: sale.customerId?._id || null,
          payment_method: sale.paymentMethod,
          items: formattedItems,
          subtotal: sale.subtotal,
          discount: { percentage: sale.discountPercent / 100, amount: sale.discountAmount },
          total: sale.total,
          ticket,
          created_at: sale.createdAt,
        };
      })
    );
    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found', id: req.params.id });
    }
    res.json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found', id: req.params.id });
    }

    await SaleItem.deleteMany({ saleId: sale._id });
    await Ticket.deleteMany({ saleId: sale._id });

    res.json({ message: 'Sale deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
