// ============================================
// FILE: routes/walletRoutes.js
// Purpose: Handle all wallet and payment operations
// ============================================

const express = require('express');
const router = express.Router();
const Seller = require('../model/Seller');
const Transaction = require('../model/Transaction');
const SellerOrder = require('../model/SellerOrder');

// ============================================
// 1. GET WALLET BALANCE
// ============================================
router.get('/wallet/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    res.json({ 
      status: "ok", 
      balance: seller.walletBalance || 0,
      totalSpent: seller.totalSpent || 0,
      totalRefunded: seller.totalRefunded || 0,
      totalOrders: seller.totalOrders || 0,
      walletStatus: seller.walletStatus || 'active'
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Server error",
      error: error.message 
    });
  }
});

// ============================================
// 2. DEDUCT FROM WALLET (Order Payment)
// ============================================
router.post('/wallet/deduct', async (req, res) => {
  try {
    const { sellerId, amount, description, orderId } = req.body;
    
    if (!sellerId || !amount) {
      return res.status(400).json({ 
        status: "error", 
        message: "Missing required fields (sellerId, amount)" 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Amount must be greater than 0" 
      });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    // Check wallet status
    if (seller.walletStatus !== 'active') {
      return res.status(403).json({ 
        status: "error", 
        message: "Wallet is not active. Please contact support." 
      });
    }
    
    // Check sufficient balance
    const currentBalance = seller.walletBalance || 0;
    if (currentBalance < amount) {
      return res.status(400).json({ 
        status: "error", 
        message: "Insufficient wallet balance",
        currentBalance: currentBalance,
        required: amount,
        shortfall: amount - currentBalance
      });
    }
    
    // Deduct amount
    seller.walletBalance = currentBalance - amount;
    seller.totalSpent = (seller.totalSpent || 0) + amount;
    seller.totalOrders = (seller.totalOrders || 0) + 1;
    await seller.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'debit',
      paymentMethod: 'wallet',
      amount: amount,
      description: description || 'Order payment',
      balanceBefore: currentBalance,
      balanceAfter: seller.walletBalance,
      status: 'completed',
      relatedOrder: orderId || null,
      transactionDate: new Date()
    });
    await transaction.save();
    
    console.log(`✅ Deducted Rs. ${amount} from seller ${sellerId}`);
    console.log(`   Balance: ${currentBalance} → ${seller.walletBalance}`);
    console.log(`   Transaction ID: ${transaction._id}`);
    
    res.json({ 
      status: "ok", 
      message: "Payment successful",
      newBalance: seller.walletBalance,
      transactionId: transaction._id,
      transaction: {
        amount: amount,
        balanceBefore: currentBalance,
        balanceAfter: seller.walletBalance,
        date: transaction.transactionDate
      }
    });
  } catch (error) {
    console.error("❌ Error deducting from wallet:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Payment failed",
      error: error.message 
    });
  }
});

// ============================================
// 3. REFUND TO WALLET (Order Rejection)
// ============================================
router.post('/wallet/refund', async (req, res) => {
  try {
    const { sellerId, amount, reason, orderId } = req.body;
    
    if (!sellerId || !amount) {
      return res.status(400).json({ 
        status: "error", 
        message: "Missing required fields (sellerId, amount)" 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Refund amount must be greater than 0" 
      });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    // Add refund amount to wallet
    const currentBalance = seller.walletBalance || 0;
    seller.walletBalance = currentBalance + amount;
    seller.totalRefunded = (seller.totalRefunded || 0) + amount;
    await seller.save();
    
    // Create refund transaction record
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'credit',
      paymentMethod: 'wallet',
      amount: amount,
      description: `Refund: ${reason || 'Order cancelled'}`,
      balanceBefore: currentBalance,
      balanceAfter: seller.walletBalance,
      status: 'completed',
      relatedOrder: orderId || null,
      isRefund: true,
      refundReason: reason || 'Order cancelled',
      transactionDate: new Date()
    });
    await transaction.save();
    
    console.log(`✅ Refunded Rs. ${amount} to seller ${sellerId}`);
    console.log(`   Balance: ${currentBalance} → ${seller.walletBalance}`);
    console.log(`   Transaction ID: ${transaction._id}`);
    
    res.json({ 
      status: "ok", 
      message: "Refund successful",
      newBalance: seller.walletBalance,
      transactionId: transaction._id,
      refund: {
        amount: amount,
        reason: reason || 'Order cancelled',
        balanceBefore: currentBalance,
        balanceAfter: seller.walletBalance,
        date: transaction.transactionDate
      }
    });
  } catch (error) {
    console.error("❌ Error processing refund:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Refund failed",
      error: error.message 
    });
  }
});

// ============================================
// 4. ADD MONEY TO WALLET (Top-up)
// ============================================
router.post('/wallet/add', async (req, res) => {
  try {
    const { sellerId, amount, description, paymentMethod } = req.body;
    
    if (!sellerId || !amount || amount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Invalid amount or missing seller ID" 
      });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    // Check wallet status
    if (seller.walletStatus === 'blocked') {
      return res.status(403).json({ 
        status: "error", 
        message: "Wallet is blocked. Please contact support." 
      });
    }
    
    const currentBalance = seller.walletBalance || 0;
    seller.walletBalance = currentBalance + amount;
    await seller.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'credit',
      paymentMethod: paymentMethod || 'card',
      amount: amount,
      description: description || 'Wallet top-up',
      balanceBefore: currentBalance,
      balanceAfter: seller.walletBalance,
      status: 'completed',
      transactionDate: new Date()
    });
    await transaction.save();
    
    console.log(`✅ Added Rs. ${amount} to seller ${sellerId} wallet`);
    console.log(`   Balance: ${currentBalance} → ${seller.walletBalance}`);
    console.log(`   Payment Method: ${paymentMethod || 'card'}`);
    console.log(`   Transaction ID: ${transaction._id}`);
    
    res.json({ 
      status: "ok", 
      message: "Wallet topped up successfully",
      newBalance: seller.walletBalance,
      transactionId: transaction._id,
      transaction: {
        amount: amount,
        balanceBefore: currentBalance,
        balanceAfter: seller.walletBalance,
        paymentMethod: paymentMethod || 'card',
        date: transaction.transactionDate
      }
    });
  } catch (error) {
    console.error("❌ Error adding to wallet:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to add money",
      error: error.message 
    });
  }
});

// ============================================
// 5. RECORD CARD PAYMENT
// ============================================
router.post('/card', async (req, res) => {
  try {
    const { sellerId, amount, cardNumber, description, orderId } = req.body;
    
    if (!sellerId || !amount) {
      return res.status(400).json({ 
        status: "error", 
        message: "Missing required fields (sellerId, amount)" 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Amount must be greater than 0" 
      });
    }
    
    // Update seller's total spent
    const seller = await Seller.findById(sellerId);
    if (seller) {
      seller.totalSpent = (seller.totalSpent || 0) + amount;
      seller.totalOrders = (seller.totalOrders || 0) + 1;
      await seller.save();
    }
    
    // Extract last 4 digits of card
    const last4 = cardNumber ? cardNumber.slice(-4) : null;
    
    // Create card payment transaction
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'debit',
      paymentMethod: 'card',
      amount: amount,
      description: description || 'Card payment',
      cardLast4: last4,
      status: 'completed',
      relatedOrder: orderId || null,
      transactionDate: new Date()
    });
    await transaction.save();
    
    console.log(`✅ Card payment of Rs. ${amount} recorded for seller ${sellerId}`);
    console.log(`   Card Last 4: ${last4}`);
    console.log(`   Transaction ID: ${transaction._id}`);
    
    res.json({ 
      status: "ok", 
      message: "Card payment successful",
      transactionId: transaction._id,
      cardLast4: last4,
      transaction: {
        amount: amount,
        cardLast4: last4,
        date: transaction.transactionDate
      }
    });
  } catch (error) {
    console.error("❌ Error recording card payment:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Payment failed",
      error: error.message 
    });
  }
});

// ============================================
// 6. GET TRANSACTION HISTORY
// ============================================
router.get('/transactions/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { limit = 50, type, status, skip = 0 } = req.query;
    
    const query = { 
      userId: sellerId,
      userType: 'seller'
    };
    
    if (type) query.type = type;
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('relatedOrder', 'orderNumber item quantity price status');
    
    const totalCount = await Transaction.countDocuments(query);
    
    res.json({ 
      status: "ok", 
      count: transactions.length,
      totalCount: totalCount,
      transactions: transactions 
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch transactions",
      error: error.message 
    });
  }
});

// ============================================
// 7. GET WALLET STATISTICS
// ============================================
router.get('/wallet/stats/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    // Get transaction statistics
    const transactions = await Transaction.find({ 
      userId: sellerId,
      userType: 'seller'
    }).sort({ transactionDate: -1 });
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalCredit = transactions
      .filter(t => t.type === 'credit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalRefunds = transactions
      .filter(t => t.isRefund && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const failedTransactions = transactions.filter(t => t.status === 'failed').length;
    
    // Get recent transactions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTransactions = transactions.filter(
      t => new Date(t.transactionDate) >= sevenDaysAgo
    );
    
    res.json({
      status: "ok",
      stats: {
        currentBalance: seller.walletBalance || 0,
        totalSpent: seller.totalSpent || 0,
        totalRefunded: seller.totalRefunded || 0,
        totalOrders: seller.totalOrders || 0,
        walletStatus: seller.walletStatus || 'active',
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        totalRefunds: totalRefunds,
        transactionCount: transactions.length,
        pendingTransactions: pendingTransactions,
        failedTransactions: failedTransactions,
        recentTransactionsCount: recentTransactions.length,
        lastTransaction: transactions[0] || null,
        avgOrderValue: seller.totalOrders > 0 ? (seller.totalSpent / seller.totalOrders).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error("Error fetching wallet stats:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch statistics",
      error: error.message 
    });
  }
});

// ============================================
// 8. GET REFUND HISTORY
// ============================================
router.get('/wallet/refunds/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { limit = 20 } = req.query;
    
    const refunds = await Transaction.find({
      userId: sellerId,
      userType: 'seller',
      type: 'credit',
      isRefund: true,
      status: 'completed'
    })
      .sort({ transactionDate: -1 })
      .limit(parseInt(limit))
      .populate('relatedOrder', 'orderNumber item quantity price status');
    
    const totalRefunded = refunds.reduce((sum, t) => sum + t.amount, 0);
    
    res.json({
      status: "ok",
      count: refunds.length,
      totalRefunded: totalRefunded,
      refunds: refunds
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch refunds",
      error: error.message 
    });
  }
});

// ============================================
// 9. CHECK SUFFICIENT BALANCE
// ============================================
router.post('/wallet/check-balance', async (req, res) => {
  try {
    const { sellerId, amount } = req.body;
    
    if (!sellerId || !amount) {
      return res.status(400).json({ 
        status: "error", 
        message: "Missing required fields" 
      });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    const currentBalance = seller.walletBalance || 0;
    const hasSufficientBalance = currentBalance >= amount;
    
    res.json({
      status: "ok",
      hasSufficientBalance: hasSufficientBalance,
      currentBalance: currentBalance,
      required: amount,
      shortfall: hasSufficientBalance ? 0 : (amount - currentBalance)
    });
  } catch (error) {
    console.error("Error checking balance:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to check balance",
      error: error.message 
    });
  }
});

// ============================================
// 10. UPDATE WALLET STATUS (Admin)
// ============================================
router.put('/wallet/status/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({ 
        status: "error", 
        message: "Invalid status. Must be: active, suspended, or blocked" 
      });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    const previousStatus = seller.walletStatus;
    seller.walletStatus = status;
    await seller.save();
    
    console.log(`✅ Updated wallet status for seller ${sellerId}`);
    console.log(`   ${previousStatus} → ${status}`);
    
    res.json({
      status: "ok",
      message: "Wallet status updated successfully",
      previousStatus: previousStatus,
      newStatus: status
    });
  } catch (error) {
    console.error("Error updating wallet status:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to update wallet status",
      error: error.message 
    });
  }
});

// ============================================
// 11. GET TRANSACTION BY ID
// ============================================
router.get('/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId)
      .populate('relatedOrder', 'orderNumber item quantity price status')
      .populate('userId', 'fname lname email mobile');
    
    if (!transaction) {
      return res.status(404).json({ 
        status: "error", 
        message: "Transaction not found" 
      });
    }
    
    res.json({
      status: "ok",
      transaction: transaction
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch transaction",
      error: error.message 
    });
  }
});

module.exports = router;