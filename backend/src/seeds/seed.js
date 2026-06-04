import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Customer, Product, User } from '../models/index.js';

dotenv.config();

const customersData = [
  { name: 'Paola Reyes', phoneOrEmail: 'paola@email.com' },
  { name: 'Ivan Reyes', phoneOrEmail: 'ivan@email.com' },
  { name: 'Roy Reyes', phoneOrEmail: 'roy@email.com' },
  { name: 'Michele Reyes', phoneOrEmail: 'michele@email.com' },
  { name: 'Cesar Vazquez', phoneOrEmail: 'cesar@email.com' },
];

const productsData = [
  { name: 'latte', price: 55, stock: 50 },
  { name: 'americano', price: 40, stock: 50 },
  { name: 'flat white', price: 50, stock: 50 },
  { name: 'frapuchino', price: 65, stock: 50 },
  { name: 'capuccino', price: 55, stock: 50 },
  { name: 'té', price: 45, stock: 50 },
];

const usersData = [
  { name: 'Admin', email: 'admin@cafecito.com', password: 'admin123', role: 'admin' },
  { name: 'Vendedor', email: 'vendedor@cafecito.com', password: 'vendedor123', role: 'seller' },
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.DB_CONNECTION_STRING || 'mongodb://127.0.0.1:27017/cafecito';
    await mongoose.connect(mongoURI);
    console.log('Conectado a MongoDB para el sembrado...');

    await Customer.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Colecciones antiguas limpiadas.');

    await Customer.insertMany(customersData);
    console.log('Clientes creados con éxito.');

    await Product.insertMany(productsData);
    console.log('Productos creados con éxito.');

    for (const u of usersData) {
      await User.create(u);
    }
    console.log('Usuarios creados con éxito.');

    console.log('¡Base de datos sembrada con éxito!');
  } catch (error) {
    console.error('Error al sembrar la base de datos:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedDB();