import Product from '../models/Product.js';

const carts = {};

export const getCart = (req, res) => {
  const cart = carts[req.user.id] || { items: [] };
  const subtotal = cart.items.reduce((sum, item) => sum + item.lineTotal, 0);
  res.json({ items: cart.items, subtotal, total: subtotal });
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = quantity || 1;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!carts[req.user.id]) carts[req.user.id] = { items: [] };
    const cart = carts[req.user.id];

    const existing = cart.items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += qty;
      existing.lineTotal = existing.unitPrice * existing.quantity;
    } else {
      cart.items.push({
        productId: product._id.toString(),
        name: product.name,
        unitPrice: product.price,
        quantity: qty,
        lineTotal: product.price * qty,
      });
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.lineTotal, 0);
    res.json({ items: cart.items, subtotal, total: subtotal });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removeFromCart = (req, res) => {
  const cart = carts[req.user.id];
  if (!cart) return res.status(404).json({ error: 'Cart is empty' });

  cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
  const subtotal = cart.items.reduce((sum, i) => sum + i.lineTotal, 0);
  res.json({ items: cart.items, subtotal, total: subtotal });
};

export const clearCart = (req, res) => {
  delete carts[req.user.id];
  res.json({ items: [], subtotal: 0, total: 0 });
};
