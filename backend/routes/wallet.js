const router = require("express").Router();
const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");
const Seller = require("../model/Seller");

// ========================================
// GET WALLET BALANCE
// ========================================
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First, get balance from Seller model
    const seller = await Seller.findById(userId);
    
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    // Try to get wallet, create if doesn't exist
    let wallet = await Wallet.findOne({ userId, userType: 'seller' });
    
    if (!wallet) {
      wallet = new Wallet({
        userId: userId,
        userType: 'seller',
        balance: seller.walletBalance || 0,
        totalSpent: seller.totalSpent || 0,
        totalRefunded: seller.totalRefunded || 0,
        walletStatus: seller.walletStatus || 'active'
      });
      await wallet.save();
    } else {
      // Sync with seller model
      wallet.balance = seller.walletBalance || 0;
      wallet.totalSpent = seller.totalSpent || 0;
      wallet.totalRefunded = seller.totalRefunded || 0;
      await wallet.save();
    }
    
    res.json({
      status: "ok",
      balance: seller.walletBalance || 0,
      totalSpent: seller.totalSpent || 0,
      totalRefunded: seller.totalRefunded || 0,
      walletStatus: seller.walletStatus || 'active'
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch wallet" 
    });
  }
});

// ========================================
// GET TRANSACTIONS
// ========================================
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const transactions = await Transaction.find({ userId, userType: 'seller' })
      .sort({ transactionDate: -1 })
      .limit(limit);
    
    res.json({
      status: "ok",
      transactions: transactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch transactions" 
    });
  }
});

// ========================================
// ADD MONEY TO WALLET (TOP UP)
// ========================================
router.post("/add", async (req, res) => {
  try {
    const { sellerId, amount, description, paymentMethod } = req.body;

    if (!sellerId || !amount || amount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Valid seller ID and amount are required" 
      });
    }

    // Update Seller model directly
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }

    const balanceBefore = seller.walletBalance || 0;
    seller.walletBalance = (seller.walletBalance || 0) + Number(amount);
    await seller.save();

    // Update or create wallet record
    let wallet = await Wallet.findOne({ userId: sellerId, userType: 'seller' });
    
    if (!wallet) {
      wallet = new Wallet({
        userId: sellerId,
        userType: 'seller',
        balance: seller.walletBalance,
        totalSpent: seller.totalSpent || 0,
        totalRefunded: seller.totalRefunded || 0,
        walletStatus: seller.walletStatus || 'active'
      });
    } else {
      wallet.balance = seller.walletBalance;
    }
    
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'credit',
      paymentMethod: paymentMethod || 'card',
      amount: Number(amount),
      balanceBefore: balanceBefore,
      balanceAfter: seller.walletBalance,
      description: description || 'Wallet top-up',
      status: 'completed',
      transactionDate: new Date(),
      processedDate: new Date(),
      isRefund: false
    });

    await transaction.save();

    console.log(`✅ Wallet top-up successful: Rs.${amount} added to seller ${sellerId}`);
    console.log(`   Previous Balance: Rs.${balanceBefore}`);
    console.log(`   New Balance: Rs.${seller.walletBalance}`);

    res.json({
      status: "ok",
      message: "Money added successfully",
      newBalance: seller.walletBalance,
      balanceBefore: balanceBefore,
      balanceAfter: seller.walletBalance,
      transaction: transaction
    });
  } catch (error) {
    console.error("Error adding money to wallet:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to add money to wallet",
      error: error.message 
    });
  }
});

// ========================================
// DEDUCT MONEY FROM WALLET (ORDER PAYMENT)
// ========================================
router.post("/deduct", async (req, res) => {
  try {
    const { sellerId, amount, description, paymentMethod, relatedOrder } = req.body;

    console.log("💰 Wallet deduction request:", req.body);

    if (!sellerId || !amount || amount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Valid seller ID and amount are required" 
      });
    }

    // Update Seller model directly
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }

    const balanceBefore = seller.walletBalance || 0;

    // Check sufficient balance
    if (balanceBefore < amount) {
      return res.status(400).json({ 
        status: "error", 
        message: "Insufficient balance" 
      });
    }

    // Deduct amount from seller
    seller.walletBalance = (seller.walletBalance || 0) - Number(amount);
    seller.totalSpent = (seller.totalSpent || 0) + Number(amount);
    seller.totalOrders = (seller.totalOrders || 0) + 1;
    await seller.save();

    // Update or create wallet record
    let wallet = await Wallet.findOne({ userId: sellerId, userType: 'seller' });
    
    if (!wallet) {
      wallet = new Wallet({
        userId: sellerId,
        userType: 'seller',
        balance: seller.walletBalance,
        totalSpent: seller.totalSpent,
        totalRefunded: seller.totalRefunded || 0,
        walletStatus: seller.walletStatus || 'active'
      });
    } else {
      wallet.balance = seller.walletBalance;
      wallet.totalSpent = seller.totalSpent;
    }
    
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'debit',
      paymentMethod: paymentMethod || 'wallet',
      amount: Number(amount),
      balanceBefore: balanceBefore,
      balanceAfter: seller.walletBalance,
      description: description || 'Order payment',
      status: 'completed',
      relatedOrder: relatedOrder || null,
      transactionDate: new Date(),
      processedDate: new Date(),
      isRefund: false
    });

    await transaction.save();

    console.log(`✅ Wallet deduction successful: Rs.${amount} deducted from seller ${sellerId}`);
    console.log(`   Previous Balance: Rs.${balanceBefore}`);
    console.log(`   New Balance: Rs.${seller.walletBalance}`);
    console.log(`   Total Spent: Rs.${seller.totalSpent}`);
    console.log(`   Total Orders: ${seller.totalOrders}`);

    res.json({
      status: "ok",
      message: "Amount deducted successfully",
      balance: seller.walletBalance,
      balanceBefore: balanceBefore,
      balanceAfter: seller.walletBalance,
      transaction: transaction
    });
  } catch (error) {
    console.error("❌ Error deducting from wallet:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to deduct amount",
      error: error.message
    });
  }
});

// ========================================
// REFUND MONEY TO WALLET
// ========================================
router.post("/refund", async (req, res) => {
  try {
    const { sellerId, amount, description, relatedOrder, originalTransactionId, refundReason } = req.body;

    console.log("💸 Wallet refund request:", req.body);

    if (!sellerId || !amount || amount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Valid seller ID and amount are required" 
      });
    }

    // Update Seller model directly
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }

    const balanceBefore = seller.walletBalance || 0;

    // Add refund amount to seller
    seller.walletBalance = (seller.walletBalance || 0) + Number(amount);
    seller.totalRefunded = (seller.totalRefunded || 0) + Number(amount);
    await seller.save();

    // Update or create wallet record
    let wallet = await Wallet.findOne({ userId: sellerId, userType: 'seller' });
    
    if (!wallet) {
      wallet = new Wallet({
        userId: sellerId,
        userType: 'seller',
        balance: seller.walletBalance,
        totalSpent: seller.totalSpent || 0,
        totalRefunded: seller.totalRefunded,
        walletStatus: seller.walletStatus || 'active'
      });
    } else {
      wallet.balance = seller.walletBalance;
      wallet.totalRefunded = seller.totalRefunded;
    }
    
    await wallet.save();

    // Create refund transaction record
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'credit',
      paymentMethod: 'wallet',
      amount: Number(amount),
      balanceBefore: balanceBefore,
      balanceAfter: seller.walletBalance,
      description: description || 'Order refund',
      status: 'completed',
      relatedOrder: relatedOrder || null,
      transactionDate: new Date(),
      processedDate: new Date(),
      isRefund: true,
      originalTransactionId: originalTransactionId || null,
      refundReason: refundReason || null
    });

    await transaction.save();

    console.log(`✅ Wallet refund successful: Rs.${amount} refunded to seller ${sellerId}`);
    console.log(`   Previous Balance: Rs.${balanceBefore}`);
    console.log(`   New Balance: Rs.${seller.walletBalance}`);
    console.log(`   Total Refunded: Rs.${seller.totalRefunded}`);

    res.json({
      status: "ok",
      message: "Refund processed successfully",
      balance: seller.walletBalance,
      balanceBefore: balanceBefore,
      balanceAfter: seller.walletBalance,
      transaction: transaction
    });
  } catch (error) {
    console.error("❌ Error processing refund:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to process refund",
      error: error.message
    });
  }
});

// ========================================
// GET WALLET STATISTICS
// ========================================
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const seller = await Seller.findById(userId);
    
    if (!seller) {
      return res.json({
        status: "ok",
        balance: 0,
        totalSpent: 0,
        totalRefunded: 0,
        transactionCount: 0,
        totalOrders: 0
      });
    }

    const transactionCount = await Transaction.countDocuments({ 
      userId, 
      userType: 'seller' 
    });

    res.json({
      status: "ok",
      balance: seller.walletBalance || 0,
      totalSpent: seller.totalSpent || 0,
      totalRefunded: seller.totalRefunded || 0,
      transactionCount: transactionCount,
      totalOrders: seller.totalOrders || 0,
      walletStatus: seller.walletStatus || 'active'
    });
  } catch (error) {
    console.error("Error fetching wallet stats:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch wallet statistics" 
    });
  }
});

// ========================================
// UPDATE WALLET STATUS
// ========================================
router.put("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'closed'].includes(status)) {
      return res.status(400).json({ 
        status: "error", 
        message: "Invalid status. Must be 'active', 'suspended', or 'closed'" 
      });
    }

    const wallet = await Wallet.findOne({ userId, userType: 'seller' });
    
    if (!wallet) {
      return res.status(404).json({ 
        status: "error", 
        message: "Wallet not found" 
      });
    }

    wallet.walletStatus = status;
    await wallet.save();

    res.json({
      status: "ok",
      message: `Wallet status updated to ${status}`,
      wallet: wallet
    });
  } catch (error) {
    console.error("Error updating wallet status:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to update wallet status" 
    });
  }
});

module.exports = router;