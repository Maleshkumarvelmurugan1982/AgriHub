const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sellerSchema = new Schema({
  userRole: {
    type: String,
  },
  fname: {
    type: String,
  },
  lname: {
    type: String,
  },
  email: {
    type: String,
  },
  district: {
    type: String,
  },
  mobile: {
    type: String,
  },
  password: {
    type: String,
  },
  primaryKey: {
    type: String,
    unique: true,
  },
  
  // ============================================
  // 💰 WALLET FIELDS
  // ============================================
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Current wallet balance'
  },
  
  totalSpent: {
    type: Number,
    default: 0,
    description: 'Total amount spent on orders'
  },
  
  totalRefunded: {
    type: Number,
    default: 0,
    description: 'Total amount refunded'
  },
  
  totalOrders: {
    type: Number,
    default: 0,
    description: 'Total number of orders placed'
  },
  
  walletStatus: {
    type: String,
    enum: ['active', 'suspended', 'blocked'],
    default: 'active',
    description: 'Wallet status'
  }
  
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

// ============================================
// INDEX for faster queries
// ============================================
sellerSchema.index({ email: 1 });
sellerSchema.index({ primaryKey: 1 });
sellerSchema.index({ walletStatus: 1 });

// ============================================
// VIRTUAL: Check if wallet has sufficient balance
// ============================================
sellerSchema.methods.hasSufficientBalance = function(amount) {
  return this.walletBalance >= amount;
};

// ============================================
// METHOD: Deduct from wallet
// ============================================
sellerSchema.methods.deductFromWallet = function(amount) {
  if (!this.hasSufficientBalance(amount)) {
    throw new Error('Insufficient wallet balance');
  }
  this.walletBalance -= amount;
  this.totalSpent += amount;
  return this.save();
};

// ============================================
// METHOD: Add to wallet (refund)
// ============================================
sellerSchema.methods.addToWallet = function(amount) {
  this.walletBalance += amount;
  this.totalRefunded += amount;
  return this.save();
};

module.exports = mongoose.model("Seller", sellerSchema);