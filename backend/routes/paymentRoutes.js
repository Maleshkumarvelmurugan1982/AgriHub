const express = require('express');
const router = express.Router();
const Payment = require('../model/Payment');
const Wallet = require('../model/Wallet');
const SellerOrder = require('../model/SellerOrder');

// Process Payment (Deduct from seller's wallet)
router.post('/process', async (req, res) => {
  try {
    const { amount, sellerId, farmerId, orderDetails } = req.body;

    if (!amount || !sellerId || !farmerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required payment information' 
      });
    }

    let sellerWallet = await Wallet.findOne({ userId: sellerId, userType: 'Seller' });
    
    if (!sellerWallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found. Please create a wallet first.',
      });
    }

    if (sellerWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: Rs. ${sellerWallet.balance.toFixed(2)}, Required: Rs. ${amount.toFixed(2)}`,
      });
    }

    sellerWallet.balance -= amount;
    sellerWallet.pendingAmount += amount;
    await sellerWallet.save();

    const payment = new Payment({
      sellerId: sellerId,
      farmerId: farmerId,
      amount: amount,
      status: 'pending',
      orderDetails: orderDetails,
      createdAt: new Date(),
    });

    await payment.save();

    sellerWallet.transactions.push({
      type: 'debit',
      amount: amount,
      description: `Payment for order - ${orderDetails.item}`,
      status: 'pending',
      paymentId: payment._id,
      date: new Date(),
    });
    await sellerWallet.save();

    console.log('✅ Payment processed (pending):', payment._id);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      paymentId: payment._id,
      transactionId: payment._id,
      remainingBalance: sellerWallet.balance,
    });

  } catch (error) {
    console.error('❌ Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message,
    });
  }
});

// Complete Payment (Transfer to farmer when order approved)
router.post('/complete', async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;

    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed',
      });
    }

    const sellerWallet = await Wallet.findOne({ 
      userId: payment.sellerId, 
      userType: 'Seller' 
    });

    let farmerWallet = await Wallet.findOne({ 
      userId: payment.farmerId, 
      userType: 'Farmer' 
    });

    if (!farmerWallet) {
      farmerWallet = new Wallet({
        userId: payment.farmerId,
        userType: 'Farmer',
        balance: 0,
        pendingAmount: 0,
        transactions: [],
      });
    }

    sellerWallet.pendingAmount -= payment.amount;
    farmerWallet.balance += payment.amount;

    await sellerWallet.save();
    await farmerWallet.save();

    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.orderId = orderId;
    await payment.save();

    const sellerTransaction = sellerWallet.transactions.find(
      t => t.paymentId && t.paymentId.toString() === paymentId
    );
    if (sellerTransaction) {
      sellerTransaction.status = 'completed';
    }
    await sellerWallet.save();

    farmerWallet.transactions.push({
      type: 'credit',
      amount: payment.amount,
      description: `Payment received for order - ${payment.orderDetails.item}`,
      status: 'completed',
      paymentId: payment._id,
      date: new Date(),
    });
    await farmerWallet.save();

    console.log('✅ Payment completed and transferred to farmer:', paymentId);

    res.json({
      success: true,
      message: 'Payment completed successfully',
      paymentId: payment._id,
      farmerBalance: farmerWallet.balance,
    });

  } catch (error) {
    console.error('❌ Payment completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete payment',
      error: error.message,
    });
  }
});

// Refund Payment (Return to seller when order rejected)
router.post('/refund', async (req, res) => {
  try {
    const { paymentId, sellerId, reason, orderId } = req.body;

    let payment;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else if (orderId) {
      const order = await SellerOrder.findById(orderId);
      if (order && order.transactionId) {
        payment = await Payment.findById(order.transactionId);
      }
    }
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Payment already refunded',
      });
    }

    const sellerWallet = await Wallet.findOne({ 
      userId: payment.sellerId, 
      userType: 'Seller' 
    });

    if (!sellerWallet) {
      return res.status(404).json({
        success: false,
        message: 'Seller wallet not found',
      });
    }

    sellerWallet.balance += payment.amount;
    sellerWallet.pendingAmount -= payment.amount;
    await sellerWallet.save();

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundReason = reason || 'Order rejected by farmer';
    await payment.save();

    const sellerTransaction = sellerWallet.transactions.find(
      t => t.paymentId && t.paymentId.toString() === payment._id.toString()
    );
    if (sellerTransaction) {
      sellerTransaction.status = 'refunded';
    }

    sellerWallet.transactions.push({
      type: 'credit',
      amount: payment.amount,
      description: `Refund for order - ${payment.orderDetails.item} (${reason || 'Order rejected'})`,
      status: 'completed',
      paymentId: payment._id,
      date: new Date(),
    });
    await sellerWallet.save();

    console.log('✅ Payment refunded to seller:', payment._id);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundId: payment._id,
      amount: payment.amount,
      newBalance: sellerWallet.balance,
    });

  } catch (error) {
    console.error('❌ Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message,
    });
  }
});

// Get Wallet Balance
router.get('/wallet/:userId/:userType', async (req, res) => {
  try {
    const { userId, userType } = req.params;

    let wallet = await Wallet.findOne({ userId, userType });

    if (!wallet) {
      wallet = new Wallet({
        userId: userId,
        userType: userType,
        balance: 0,
        pendingAmount: 0,
        transactions: [],
      });
      await wallet.save();
    }

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        pendingAmount: wallet.pendingAmount,
        totalBalance: wallet.balance + wallet.pendingAmount,
        currency: 'LKR',
      },
    });

  } catch (error) {
    console.error('❌ Wallet fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
      error: error.message,
    });
  }
});

// Add Money to Wallet
router.post('/wallet/add-money', async (req, res) => {
  try {
    const { userId, userType, amount } = req.body;

    if (!userId || !userType || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
      });
    }

    let wallet = await Wallet.findOne({ userId, userType });

    if (!wallet) {
      wallet = new Wallet({
        userId: userId,
        userType: userType,
        balance: 0,
        pendingAmount: 0,
        transactions: [],
      });
    }

    wallet.balance += amount;
    
    wallet.transactions.push({
      type: 'credit',
      amount: amount,
      description: 'Money added to wallet',
      status: 'completed',
      date: new Date(),
    });

    await wallet.save();

    console.log('✅ Money added to wallet:', userId, amount);

    res.json({
      success: true,
      message: 'Money added successfully',
      newBalance: wallet.balance,
    });

  } catch (error) {
    console.error('❌ Add money error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add money',
      error: error.message,
    });
  }
});

// Get Transaction History
router.get('/transactions/:userId/:userType', async (req, res) => {
  try {
    const { userId, userType } = req.params;

    const wallet = await Wallet.findOne({ userId, userType });

    if (!wallet) {
      return res.json({
        success: true,
        transactions: [],
      });
    }

    res.json({
      success: true,
      transactions: wallet.transactions.sort((a, b) => b.date - a.date),
    });

  } catch (error) {
    console.error('❌ Transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

// Withdraw Money from Wallet
router.post('/wallet/withdraw', async (req, res) => {
  try {
    const { userId, userType, amount, bankDetails } = req.body;

    if (!userId || !userType || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
      });
    }

    const wallet = await Wallet.findOne({ userId, userType });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    wallet.balance -= amount;
    
    wallet.transactions.push({
      type: 'debit',
      amount: amount,
      description: `Withdrawal to ${bankDetails?.accountNumber || 'bank account'}`,
      status: 'completed',
      date: new Date(),
    });

    await wallet.save();

    console.log('✅ Money withdrawn from wallet:', userId, amount);

    res.json({
      success: true,
      message: 'Withdrawal successful',
      newBalance: wallet.balance,
    });

  } catch (error) {
    console.error('❌ Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message,
    });
  }
});

module.exports = router;