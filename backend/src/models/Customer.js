import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phoneOrEmail: {
      type: String,
      required: [true, 'Phone or email is required'],
      trim: true,
    },
    purchasesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'customers',
  }
);

export default mongoose.model('Customer', customerSchema);
