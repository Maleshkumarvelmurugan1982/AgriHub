const mongoose = require('mongoose');

const sivaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    default: 'Guest Siva'
  },
  email: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  isGuest: {
    type: Boolean,
    default: true
  },
  assignedOrders: [{
    orderId: String,
    orderType: String, // 'seller' or 'farmer'
    assignedAt: Date
  }],
  totalDeliveries: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Siva', sivaSchema);
