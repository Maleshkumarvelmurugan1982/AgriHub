// ============================================
// models/Transaction.js
// Complete Transaction Model for Payment Tracking
// ============================================

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // ============================================
  // USER REFERENCE
  // ============================================
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'  // Dynamic reference based on userType
  },
  userType: {
    type: String,
    required: true,
    enum: ['seller', 'farmer', 'Seller', 'Farmer', 'deliveryman', 'Deliveryman']
  },
  
  // ============================================
  // TRANSACTION TYPE
  // ============================================
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit'],  // credit = money in, debit = money out
    description: 'credit: money added, debit: money deducted'
  },
  
  // ============================================
  // PAYMENT METHOD
  // ============================================
  paymentMethod: {
    type: String,
    enum: ['wallet', 'card', 'cash', 'bank_transfer', null],
    default: 'wallet'
  },
  
  // ============================================
  // AMOUNT & BALANCE
  // ============================================
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceBefore: {
    type: Number,
    default: 0,
    description: 'Wallet balance before this transaction'
  },
  balanceAfter: {
    type: Number,
    default: 0,
    description: 'Wallet balance after this transaction'
  },
  
  // ============================================
  // TRANSACTION DETAILS
  // ============================================
  description: {
    type: String,
    required: true,
    description: 'Human-readable description of the transaction'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
    default: 'completed'
  },
  
  // ============================================
  // CARD PAYMENT INFO
  // ============================================
  cardLast4: {
    type: String,
    default: null,
    description: 'Last 4 digits of card (for security)'
  },
  cardType: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover', null],
    default: null
  },
  
  // ============================================
  // RELATED ORDER
  // ============================================
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerOrder',
    default: null,
    description: 'Link to the order this transaction is related to'
  },
  
  // ============================================
  // DATE & TIME
  // ============================================
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedDate: {
    type: Date,
    default: null,
    description: 'When the transaction was fully processed'
  },
  
  // ============================================
  // METADATA
  // ============================================
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    notes: String
  },
  
  // ============================================
  // REFUND INFO (if applicable)
  // ============================================
  isRefund: {
    type: Boolean,
    default: false
  },
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
    description: 'Reference to original transaction if this is a refund'
  },
  refundReason: {
    type: String,
    default: null
  }
  
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

// ============================================
// 📊 INDEXES for faster queries
// ============================================
TransactionSchema.index({ userId: 1, transactionDate: -1 });
TransactionSchema.index({ userType: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ paymentMethod: 1 });
TransactionSchema.index({ relatedOrder: 1 });
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, status: 1 });

// ============================================
// 🔢 VIRTUAL PROPERTIES
// ============================================

// Check if transaction is recent (within 24 hours)
TransactionSchema.virtual('isRecent').get(function() {
  const hoursSince = (Date.now() - this.transactionDate) / (1000 * 60 * 60);
  return hoursSince < 24;
});

// Check if transaction is completed
TransactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Get transaction age in days
TransactionSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.transactionDate) / (1000 * 60 * 60 * 24));
});

// Format amount with currency
TransactionSchema.virtual('formattedAmount').get(function() {
  return `Rs. ${this.amount.toFixed(2)}`;
});

// ============================================
// 📝 INSTANCE METHODS
// ============================================

// Mark transaction as completed
TransactionSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.processedDate = new Date();
  return this.save();
};

// Mark transaction as failed
TransactionSchema.methods.markFailed = function(reason = '') {
  this.status = 'failed';
  this.processedDate = new Date();
  if (reason) {
    this.metadata = this.metadata || {};
    this.metadata.notes = reason;
  }
  return this.save();
};

// Create refund transaction
TransactionSchema.methods.createRefund = async function(reason = '') {
  if (this.type !== 'debit') {
    throw new Error('Can only refund debit transactions');
  }
  
  const RefundTransaction = this.constructor;
  const refund = new RefundTransaction({
    userId: this.userId,
    userType: this.userType,
    type: 'credit',  // Refund is credit (money back)
    paymentMethod: this.paymentMethod,
    amount: this.amount,
    description: `Refund: ${this.description}`,
    balanceBefore: 0,  // Will be updated
    balanceAfter: 0,   // Will be updated
    status: 'completed',
    isRefund: true,
    originalTransactionId: this._id,
    refundReason: reason,
    relatedOrder: this.relatedOrder,
    transactionDate: new Date()
  });
  
  return await refund.save();
};

// Get transaction summary
TransactionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.type,
    amount: this.amount,
    formattedAmount: this.formattedAmount,
    description: this.description,
    status: this.status,
    paymentMethod: this.paymentMethod,
    date: this.transactionDate,
    isRefund: this.isRefund
  };
};

// ============================================
// 🔍 STATIC METHODS
// ============================================

// Get user's transaction history
TransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const query = { userId };
  
  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  if (options.paymentMethod) query.paymentMethod = options.paymentMethod;
  
  return this.find(query)
    .sort({ transactionDate: -1 })
    .limit(options.limit || 100)
    .populate('relatedOrder', 'orderNumber item quantity price status');
};

// Get transactions by date range
TransactionSchema.statics.getTransactionsByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId: userId,
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .sort({ transactionDate: -1 })
    .populate('relatedOrder', 'orderNumber item');
};

// Get user's total spent
TransactionSchema.statics.getTotalSpent = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        type: 'debit',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' }
      }
    }
  ]);
  
  return result[0]?.totalSpent || 0;
};

// Get user's total refunds
TransactionSchema.statics.getTotalRefunds = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        type: 'credit',
        isRefund: true,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: '$amount' }
      }
    }
  ]);
  
  return result[0]?.totalRefunds || 0;
};

// Get transaction statistics for user
TransactionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalDebit: {
          $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
        },
        totalCredit: {
          $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
        },
        totalRefunds: {
          $sum: { $cond: ['$isRefund', '$amount', 0] }
        },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalDebit: 0,
    totalCredit: 0,
    totalRefunds: 0,
    completedCount: 0,
    failedCount: 0
  };
};

// Get recent transactions (last 30 days)
TransactionSchema.statics.getRecentTransactions = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId: userId,
    transactionDate: { $gte: startDate }
  })
    .sort({ transactionDate: -1 })
    .populate('relatedOrder', 'orderNumber item');
};

// Get pending transactions
TransactionSchema.statics.getPendingTransactions = function(userId) {
  return this.find({
    userId: userId,
    status: 'pending'
  })
    .sort({ transactionDate: -1 });
};

// Get failed transactions
TransactionSchema.statics.getFailedTransactions = function(userId) {
  return this.find({
    userId: userId,
    status: 'failed'
  })
    .sort({ transactionDate: -1 });
};

// Get transactions by order
TransactionSchema.statics.getOrderTransactions = function(orderId) {
  return this.find({
    relatedOrder: orderId
  })
    .sort({ transactionDate: -1 });
};

// Get all refund transactions
TransactionSchema.statics.getRefunds = function(userId) {
  return this.find({
    userId: userId,
    isRefund: true,
    status: 'completed'
  })
    .sort({ transactionDate: -1 })
    .populate('relatedOrder', 'orderNumber item')
    .populate('originalTransactionId');
};

// ============================================
// 🔔 PRE-SAVE MIDDLEWARE
// ============================================
TransactionSchema.pre('save', function(next) {
  // Set processedDate if status is completed and not already set
  if (this.status === 'completed' && !this.processedDate) {
    this.processedDate = new Date();
  }
  
  // Validate amount is positive
  if (this.amount < 0) {
    return next(new Error('Transaction amount cannot be negative'));
  }
  
  // Ensure balanceAfter is calculated correctly
  if (this.type === 'debit') {
    if (this.balanceAfter > this.balanceBefore) {
      return next(new Error('Balance after debit cannot be greater than balance before'));
    }
  } else if (this.type === 'credit') {
    if (this.balanceAfter < this.balanceBefore) {
      return next(new Error('Balance after credit cannot be less than balance before'));
    }
  }
  
  next();
});

// ============================================
// 🔔 POST-SAVE MIDDLEWARE
// ============================================
TransactionSchema.post('save', function(doc) {
  // Log transaction for audit trail
  console.log(`💳 Transaction saved: ${doc.type.toUpperCase()} Rs.${doc.amount} - ${doc.description}`);
  
  // Here you can add:
  // - Email notification
  // - SMS notification
  // - Webhook calls
  // - Audit logging
});

// ============================================
// 🔒 SCHEMA OPTIONS
// ============================================
TransactionSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

TransactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Transaction', TransactionSchema);