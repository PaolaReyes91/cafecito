import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import {
  createSale,
  getAllSales,
  getSaleById,
} from '../controllers/saleController.js';
import {
  generateTicket,
  getTicketBySaleId,
  getAllTickets,
} from '../controllers/ticketController.js';
import { register, login, getMe } from '../controllers/authController.js';

const router = Router();

router.get('/', (req, res) => res.json({ message: 'Cafecito API' }));

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', authenticate, authorize('admin'), createProduct);
router.put('/products/:id', authenticate, authorize('admin'), updateProduct);
router.delete('/products/:id', authenticate, authorize('admin'), deleteProduct);

router.post('/customers', authenticate, createCustomer);
router.get('/customers', authenticate, getAllCustomers);
router.get('/customers/:id', authenticate, getCustomerById);
router.put('/customers/:id', authenticate, updateCustomer);
router.delete('/customers/:id', authenticate, deleteCustomer);

router.post('/sales', authenticate, createSale);
router.get('/sales', authenticate, getAllSales);
router.get('/sales/:id', authenticate, getSaleById);

router.post('/tickets/generate/:saleId', authenticate, generateTicket);
router.get('/tickets/sale/:saleId', authenticate, getTicketBySaleId);
router.get('/tickets', authenticate, getAllTickets);

export default router;
