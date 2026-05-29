import { faker } from '@faker-js/faker';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import Customer from '../../src/models/Customer.js';
import Sale from '../../src/models/Sale.js';
import SaleItem from '../../src/models/SaleItem.js';

export const buildUser = (overrides = {}) => ({
  name: overrides.name || faker.person.fullName(),
  email: overrides.email || faker.internet.email().toLowerCase(),
  password: overrides.password || 'password123',
  role: overrides.role || 'seller',
});

export const createUser = async (overrides = {}) => {
  const data = buildUser(overrides);
  return User.create(data);
};

export const buildProduct = (overrides = {}) => ({
  name: overrides.name || faker.commerce.productName(),
  price: overrides.price ?? parseFloat(faker.commerce.price({ min: 10, max: 200 })),
  stock: overrides.stock ?? faker.number.int({ min: 1, max: 50 }),
});

export const createProduct = async (overrides = {}) => {
  const data = buildProduct(overrides);
  return Product.create(data);
};

export const buildCustomer = (overrides = {}) => ({
  name: overrides.name || faker.person.fullName(),
  phoneOrEmail: overrides.phoneOrEmail || faker.phone.number({ style: 'international' }),
  purchasesCount: overrides.purchasesCount ?? 0,
});

export const createCustomer = async (overrides = {}) => {
  const data = buildCustomer(overrides);
  return Customer.create(data);
};

export const createSaleWithItems = async ({
  customerId = null,
  paymentMethod = 'cash',
  products = [],
} = {}) => {
  const items = products.map((p) => {
    const doc = p._doc || p;
    return {
      productId: doc._id,
      productNameSnapshot: doc.name,
      unitPriceSnapshot: doc.price,
      quantity: doc.qty || 1,
      lineTotal: doc.price * (doc.qty || 1),
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const discountPercent = 0;
  const discountAmount = 0;
  const total = subtotal;

  const sale = await Sale.create({
    customerId,
    paymentMethod,
    subtotal,
    discountPercent,
    discountAmount,
    total,
  });

  const saleItems = items.map((i) => ({ ...i, saleId: sale._id }));
  await SaleItem.insertMany(saleItems);

  return Sale.findById(sale._id);
};
