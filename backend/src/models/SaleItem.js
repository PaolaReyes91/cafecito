import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: [true, 'Sale ID is required'],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    productNameSnapshot: {
      type: String,
      trim: true,
    },
    unitPriceSnapshot: {
      type: Number,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    lineTotal: {
      type: Number,
    },
  },
  {
    timestamps: false,
    collection: 'saleitems',
  }
);

saleItemSchema.pre('save', function () {
  this.lineTotal = (this.unitPriceSnapshot || 0) * this.quantity;
});

export default mongoose.model('SaleItem', saleItemSchema);
