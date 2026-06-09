import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './src/config/database.js';
import router from './src/routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', router);

app.get('/', (req, res) => {
  res.send('Bienvenido al servidor de Cafecito Feliz');
});

// Función asíncrona para inicializar la app en el orden correcto
const startServer = async () => {
  try {
    // 1. Conectamos a MongoDB Atlas primero
    await connectDB();
    console.log('Conexión exitosa a la base de datos.');

    // 2. Escuchamos en el puerto asignado por Render (usando '0.0.0.0' para producción)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo exitosamente en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor de Cafecito:', error);
    process.exit(1); // Apaga el proceso si la base de datos falla
  }
};

// Arrancamos el servidor
startServer();