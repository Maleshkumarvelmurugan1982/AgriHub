const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['seller', 'farmer', 'deliveryman'],
    default: 'seller'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRefunded: {
    type: Number,
    default: 0,
    min: 0
  },
  walletStatus: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  currency: {
    type: String,
    default: 'LKR'
  },
  lastTransactionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
walletSchema.index({ userId: 1, userType: 1 }, { unique: true });
walletSchema.index({ walletStatus: 1 });

// Update lastTransactionDate on save
walletSchema.pre('save', function(next) {
  if (this.isModified('balance')) {
    this.lastTransactionDate = new Date();
  }
  next();
});

module.exports = mongoose.model("Wallet", walletSchema);