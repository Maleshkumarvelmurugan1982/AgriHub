const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerOrder',
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'LKR',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'failed', 'cancelled'],
    default: 'pending',
  },
  refundReason: {
    type: String,
  },
  orderDetails: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  refundedAt: {
    type: Date,
  },
});

paymentSchema.index({ sellerId: 1 });
paymentSchema.index({ farmerId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);