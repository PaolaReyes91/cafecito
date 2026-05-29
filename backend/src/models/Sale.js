import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'cash',
      trim: true,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'sales',
  }
);

export default mongoose.model('Sale', saleSchema);
