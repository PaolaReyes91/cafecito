import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||'mongodb://127.0.0.1:27017/cafecito';
    const conn = await mongoose.connect(uri);
    console.log('✅ MongoDB conectado:', conn.connection.host);
    return conn;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};
