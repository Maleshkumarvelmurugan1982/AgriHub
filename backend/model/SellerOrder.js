// ============================================
// models/SellerOrder.js - Updated with Payment Fields
// ============================================

const mongoose = require("mongoose");

const sellerOrderSchema = new mongoose.Schema({
  name: { type: String, required: false },
  item: { type: String, required: true },
  productImage: String,
  category: String,
  quantity: { type: Number, required: true },
  price: Number,
  district: String,
  company: String,
  mobile: String,
  email: String,
  address: String,
  postedDate: String,
  expireDate: String,
  
  status: { 
    type: String, 
    enum: ["pending", "approved", "disapproved"],
    default: "pending" 
  },
  
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Seller",
    required: true
  },
  
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Farmer",
    required: true
  },
  
  acceptedByDeliveryman: { 
    type: Boolean, 
    default: false 
  },
  
  deliverymanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Deliveryman", 
    default: null 
  },
  
  deliveryStatus: {
    type: String,
    enum: ["pending", "in-transit", "delivered", "not-delivered"],
    default: "pending",
  },
  
  // ============================================
  // 💰 PAYMENT FIELDS
  // ============================================
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
    description: 'Payment status of the order'
  },
  
  paymentMethod: {
    type: String,
    enum: ['wallet', 'card', 'cash'],
    default: 'wallet',
    description: 'Payment method used'
  },
  
  paidAmount: {
    type: Number,
    default: 0,
    description: 'Amount paid by seller'
  },
  
  refundAmount: {
    type: Number,
    default: 0,
    description: 'Amount refunded to seller'
  },
  
  paymentDate: {
    type: Date,
    default: null,
    description: 'When payment was made'
  },
  
  refundDate: {
    type: Date,
    default: null,
    description: 'When refund was processed'
  },
  
  orderNumber: {
    type: String,
    unique: true,
    description: 'Unique order number for tracking'
  },
  
  // ============================================
  // DATE TRACKING
  // ============================================
  farmerApprovalDate: {
    type: Date,
    default: null
  },
  
  farmerDisapprovalDate: {
    type: Date,
    default: null
  },
  
  disapprovalReason: {
    type: String,
    default: null
  },
  
  deliveryAcceptedDate: {
    type: Date,
    default: null
  },
  
  deliveryCompletedDate: {
    type: Date,
    default: null
  },
  
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  
  // ============================================
  // NOTES
  // ============================================
  sellerNotes: {
    type: String,
    default: ""
  },
  
  farmerNotes: {
    type: String,
    default: ""
  },
  
  deliveryNotes: {
    type: String,
    default: ""
  }
  
}, {
  timestamps: true
});

// ============================================
// PRE-SAVE: Generate order number
// ============================================
sellerOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  
  // Update dates based on status changes
  if (this.isModified('status')) {
    this.statusUpdatedAt = new Date();
    
    if (this.status === 'approved' && !this.farmerApprovalDate) {
      this.farmerApprovalDate = new Date();
    }
    
    if (this.status === 'disapproved' && !this.farmerDisapprovalDate) {
      this.farmerDisapprovalDate = new Date();
    }
  }
  
  if (this.isModified('acceptedByDeliveryman') && this.acceptedByDeliveryman && !this.deliveryAcceptedDate) {
    this.deliveryAcceptedDate = new Date();
  }
  
  if (this.isModified('deliveryStatus') && this.deliveryStatus === 'delivered' && !this.deliveryCompletedDate) {
    this.deliveryCompletedDate = new Date();
  }
  
  next();
});

// ============================================
// INDEXES
// ============================================
sellerOrderSchema.index({ sellerId: 1, status: 1 });
sellerOrderSchema.index({ farmerId: 1, status: 1 });
sellerOrderSchema.index({ deliverymanId: 1, deliveryStatus: 1 });
sellerOrderSchema.index({ paymentStatus: 1 });
sellerOrderSchema.index({ orderNumber: 1 });
sellerOrderSchema.index({ createdAt: -1 });

// ============================================
// STATIC METHODS
// ============================================
sellerOrderSchema.statics.getSellerOrders = function(sellerId, options = {}) {
  const query = { sellerId };
  if (options.status) query.status = options.status;
  if (options.paymentStatus) query.paymentStatus = options.paymentStatus;
  
  return this.find(query)
    .populate('farmerId', 'fname lname email mobile')
    .populate('deliverymanId', 'fname lname email mobile')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

sellerOrderSchema.statics.getFarmerOrders = function(farmerId, options = {}) {
  const query = { farmerId };
  if (options.status) query.status = options.status;
  if (options.paymentStatus) query.paymentStatus = options.paymentStatus;
  
  return this.find(query)
    .populate('sellerId', 'fname lname email mobile')
    .populate('deliverymanId', 'fname lname email mobile')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

module.exports = mongoose.model("SellerOrder", sellerOrderSchema);