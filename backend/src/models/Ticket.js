import mongoose from 'mongoose';

const ticketItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: [true, 'Sale ID is required'],
      unique: true,
    },
    storeName: {
      type: String,
      default: 'Cafecito Feliz',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    items: [ticketItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'cash',
    },
  },
  {
    timestamps: true,
    collection: 'tickets',
  }
);

export default mongoose.model('Ticket', ticketSchema);
