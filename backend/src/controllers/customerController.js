import Customer from '../models/Customer.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cafecito-secret-dev';

/**
 * Función auxiliar para generar el token JWT de sesión
 */
const generateToken = (customer) => {
  return jwt.sign({ id: customer._id, role: 'customer' }, JWT_SECRET, {
    expiresIn: '8h',
  });
};

/**
 * POST /api/customers/register
 * Registrar un nuevo cliente (o alta rápida desde el POS / Administración)
 */
export const registerCustomer = async (req, res) => {
  try {
    const { name, phone_or_email, phoneOrEmail, password } = req.body;
    
    // 1. Unificar el campo de contacto eliminando espacios en blanco extraños
    const emailOrPhone = (phoneOrEmail || phone_or_email || '').trim();
    
    // 2. Validación del Nombre (mínimo 2 caracteres)
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: [{ field: 'name', message: 'El nombre debe tener al menos 2 caracteres.' }] 
      });
    }
    
    // 3. Validación de presencia de datos en el campo unificado
    if (!emailOrPhone) {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: [{ field: 'phone_or_email', message: 'El teléfono o correo electrónico es requerido.' }] 
      });
    }
    
    // 4. REGLA DE NEGOCIO: Si no es un correo electrónico (no incluye @), debe ser un número de exactamente 10 dígitos
    if (!emailOrPhone.includes('@')) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(emailOrPhone)) {
        return res.status(422).json({ 
          error: 'Validation failed', 
          details: [{ field: 'phone_or_email', message: 'El número telefónico debe constar de exactamente 10 dígitos numéricos (sin clave lada ni prefijos).' }] 
        });
      }
    }
    
    // 5. Asignar contraseña por defecto si el registro proviene de un flujo rápido sin este campo
    const fallbackPassword = password || 'Cafecito123';
    
    // 6. Validar la longitud mínima de la contraseña definitiva
    if (!fallbackPassword || fallbackPassword.length < 6) {
      return res.status(422).json({ 
        error: 'Validation failed', 
        details: [{ field: 'password', message: 'La contraseña debe tener al menos 6 caracteres.' }] 
      });
    }
    
    // 7. Verificar si el teléfono o correo ya existen en la base de datos
    const existing = await Customer.findOne({ phoneOrEmail: emailOrPhone });
    if (existing) {
      return res.status(400).json({
        error: 'El cliente ya se encuentra registrado con este teléfono o correo electrónico.',
        details: [{ field: 'phone_or_email', message: 'Este identificador de contacto ya está en uso.' }],
      });
    }

    // 8. Crear y persistir el cliente en MongoDB
    const customer = await Customer.create({ 
      name: name.trim(), 
      phoneOrEmail: emailOrPhone,
      password: fallbackPassword
    });
    
    // 9. Responder con el token de acceso y la estructura limpia del cliente
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

/**
 * POST /api/customers/login
 * Autenticación de Clientes existentes
 */
export const loginCustomer = async (req, res) => {
  try {
    const { phone_or_email, phoneOrEmail, password } = req.body;
    const emailOrPhone = (phoneOrEmail || phone_or_email || '').trim();
    
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'El identificador (teléfono/correo) y la contraseña son requeridos.' });
    }
    
    // Se fuerza explícitamente la selección de la contraseña ya que en el modelo tiene select: false
    const customer = await Customer.findOne({ phoneOrEmail: emailOrPhone }).select('+password');
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
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

/**
 * GET /api/customers/profile
 * Obtener el perfil del cliente autenticado a través de la sesión activa
 */
export const getCustomerProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }
    res.json({ customer: req.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/customers
 * Listar clientes con paginación y búsqueda (Requerido para la vista CustomerList.jsx)
 */
export const getCustomersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.q ? req.query.q.trim() : '';

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneOrEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Customer.countDocuments(query);
    const data = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mapear los registros para asegurar la devolución consistente de la propiedad .id en el frontend
    const formattedData = data.map(c => ({
      id: c._id,
      name: c.name,
      phoneOrEmail: c.phoneOrEmail,
      purchasesCount: c.purchasesCount || 0
    }));

    res.json({
      total,
      page,
      limit,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};