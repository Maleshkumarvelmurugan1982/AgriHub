// ============================================
// routes/orderRoutes.js
// Complete Order Routes with Payment & Refund
// ============================================

const express = require('express');
const router = express.Router();
const SellerOrder = require('../model/SellerOrder');
const Seller = require('../model/Seller');
const Transaction = require('../model/Transaction');

// ============================================
// 1. CREATE ORDER WITH PAYMENT
// ============================================
router.post('/add', async (req, res) => {
  try {
    const { sellerId, farmerId, paymentMethod, ...orderData } = req.body;
    
    // Validate required fields
    if (!sellerId || !farmerId) {
      return res.status(400).json({ 
        status: "error", 
        message: "Seller ID and Farmer ID are required" 
      });
    }
    
    const orderAmount = Number(orderData.price);
    
    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Invalid order amount" 
      });
    }
    
    console.log(`\n💰 Processing new order payment...`);
    console.log(`   Seller ID: ${sellerId}`);
    console.log(`   Farmer ID: ${farmerId}`);
    console.log(`   Amount: Rs. ${orderAmount}`);
    console.log(`   Payment Method: ${paymentMethod || 'wallet'}`);
    
    // Get seller details
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        status: "error", 
        message: "Seller not found" 
      });
    }
    
    // Check wallet balance if payment method is wallet
    const selectedPaymentMethod = paymentMethod || 'wallet';
    
    if (selectedPaymentMethod === 'wallet') {
      const currentBalance = seller.walletBalance || 0;
      
      if (currentBalance < orderAmount) {
        return res.status(400).json({ 
          status: "error", 
          message: "Insufficient wallet balance",
          currentBalance: currentBalance,
          required: orderAmount,
          shortfall: orderAmount - currentBalance
        });
      }
      
      // Deduct from wallet
      seller.walletBalance = currentBalance - orderAmount;
      seller.totalSpent = (seller.totalSpent || 0) + orderAmount;
      seller.totalOrders = (seller.totalOrders || 0) + 1;
      await seller.save();
      
      console.log(`   ✅ Deducted from wallet`);
      console.log(`      Balance: ${currentBalance} → ${seller.walletBalance}`);
    }
    
    // Create the order
    const newOrder = new SellerOrder({
      ...orderData,
      sellerId,
      farmerId,
      status: 'pending',
      paymentStatus: 'paid',
      paymentMethod: selectedPaymentMethod,
      paidAmount: orderAmount,
      paymentDate: new Date()
    });
    
    await newOrder.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId: sellerId,
      userType: 'seller',
      type: 'debit',
      paymentMethod: selectedPaymentMethod,
      amount: orderAmount,
      description: `Order payment for ${orderData.item} (Order #${newOrder.orderNumber})`,
      balanceBefore: selectedPaymentMethod === 'wallet' ? (seller.walletBalance + orderAmount) : 0,
      balanceAfter: selectedPaymentMethod === 'wallet' ? seller.walletBalance : 0,
      status: 'completed',
      relatedOrder: newOrder._id,
      transactionDate: new Date()
    });
    await transaction.save();
    
    console.log(`   ✅ Order created successfully`);
    console.log(`      Order ID: ${newOrder._id}`);
    console.log(`      Order Number: ${newOrder.orderNumber}`);
    console.log(`      Transaction ID: ${transaction._id}`);
    
    res.status(201).json({ 
      status: "ok", 
      message: "Order placed and payment successful",
      order: newOrder,
      transaction: {
        id: transaction._id,
        amount: orderAmount,
        balanceAfter: seller.walletBalance
      }
    });
    
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to create order",
      error: error.message 
    });
  }
});

// ============================================
// 2. FARMER APPROVE/DISAPPROVE ORDER
// ============================================
router.post('/update-status', async (req, res) => {
  try {
    const { orderId, status, farmerId, reason, notes } = req.body;
    
    // Validate inputs
    if (!orderId || !status || !farmerId) {
      return res.status(400).json({ 
        status: "error", 
        message: "Missing required fields (orderId, status, farmerId)" 
      });
    }
    
    if (!['approved', 'disapproved', 'pending'].includes(status)) {
      return res.status(400).json({ 
        status: "error", 
        message: "Invalid status. Must be: approved, disapproved, or pending" 
      });
    }
    
    // Find the order
    const order = await SellerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        status: "error", 
        message: "Order not found" 
      });
    }
    
    // Verify farmer owns this order
    if (order.farmerId.toString() !== farmerId) {
      return res.status(403).json({ 
        status: "error", 
        message: "Unauthorized - This order doesn't belong to you" 
      });
    }
    
    // Check if order can be reviewed
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        status: "error", 
        message: `Order already ${order.status}. Cannot change status.` 
      });
    }
    
    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;
    
    // ========== HANDLE DISAPPROVAL (REFUND) ==========
    if (status === 'disapproved') {
      console.log(`\n🔄 Processing ORDER DISAPPROVAL & REFUND...`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Order Number: ${order.orderNumber}`);
      console.log(`   Seller ID: ${order.sellerId}`);
      console.log(`   Amount: Rs. ${order.price}`);
      console.log(`   Payment Status: ${order.paymentStatus}`);
      console.log(`   Payment Method: ${order.paymentMethod}`);
      
      // Update order status
      order.status = 'disapproved';
      order.farmerDisapprovalDate = new Date();
      order.statusUpdatedAt = new Date();
      order.disapprovalReason = reason || 'No reason provided';
      if (notes) order.farmerNotes = notes;
      
      // Process refund if payment was made
      if (order.paymentStatus === 'paid') {
        const refundAmount = order.paidAmount || order.price;
        const sellerId = order.sellerId;
        
        console.log(`   💰 Payment was made - Processing refund...`);
        
        // Get seller
        const seller = await Seller.findById(sellerId);
        if (!seller) {
          console.log(`   ⚠️ Seller not found for refund`);
          return res.status(404).json({ 
            status: "error", 
            message: "Seller not found for refund" 
          });
        }
        
        // ===== WALLET REFUND =====
        if (order.paymentMethod === 'wallet') {
          const currentBalance = seller.walletBalance || 0;
          seller.walletBalance = currentBalance + refundAmount;
          seller.totalRefunded = (seller.totalRefunded || 0) + refundAmount;
          await seller.save();
          
          // Create refund transaction
          const transaction = new Transaction({
            userId: sellerId,
            userType: 'seller',
            type: 'credit',
            paymentMethod: 'wallet',
            amount: refundAmount,
            description: `Refund for disapproved order: ${order.item} (Order #${order.orderNumber})`,
            balanceBefore: currentBalance,
            balanceAfter: seller.walletBalance,
            status: 'completed',
            relatedOrder: orderId,
            isRefund: true,
            refundReason: order.disapprovalReason,
            transactionDate: new Date()
          });
          await transaction.save();
          
          console.log(`   ✅ WALLET REFUND SUCCESS`);
          console.log(`      Amount: Rs. ${refundAmount}`);
          console.log(`      Balance: ${currentBalance} → ${seller.walletBalance}`);
          console.log(`      Transaction ID: ${transaction._id}`);
        } 
        // ===== CARD REFUND =====
        else if (order.paymentMethod === 'card') {
          const transaction = new Transaction({
            userId: sellerId,
            userType: 'seller',
            type: 'credit',
            paymentMethod: 'card',
            amount: refundAmount,
            description: `Card refund for disapproved order: ${order.item} (Order #${order.orderNumber})`,
            status: 'completed',
            relatedOrder: orderId,
            isRefund: true,
            refundReason: order.disapprovalReason,
            transactionDate: new Date()
          });
          await transaction.save();
          
          seller.totalRefunded = (seller.totalRefunded || 0) + refundAmount;
          await seller.save();
          
          console.log(`   ✅ CARD REFUND RECORDED`);
          console.log(`      Amount: Rs. ${refundAmount}`);
          console.log(`      Transaction ID: ${transaction._id}`);
          console.log(`      Note: Refund will be processed to original card`);
        }
        
        // Update order payment status
        order.paymentStatus = 'refunded';
        order.refundDate = new Date();
        order.refundAmount = refundAmount;
        
        console.log(`   ✅ Order payment status updated to 'refunded'`);
      } else {
        console.log(`   ℹ️  No payment to refund (Payment Status: ${order.paymentStatus})`);
      }
    }
    
    // ========== HANDLE APPROVAL ==========
    else if (status === 'approved') {
      console.log(`\n✅ Processing ORDER APPROVAL...`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Order Number: ${order.orderNumber}`);
      console.log(`   Seller ID: ${order.sellerId}`);
      console.log(`   Amount: Rs. ${order.price}`);
      
      order.status = 'approved';
      order.farmerApprovalDate = new Date();
      order.statusUpdatedAt = new Date();
      if (notes) order.farmerNotes = notes;
      
      console.log(`   ✅ Order approved successfully`);
    }
    
    // Save the order
    await order.save();
    
    // Prepare response
    const response = {
      status: "ok",
      message: `Order ${status} successfully`,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        item: order.item,
        quantity: order.quantity,
        price: order.price,
        status: order.status,
        paymentStatus: order.paymentStatus,
        previousStatus: previousStatus,
        previousPaymentStatus: previousPaymentStatus
      }
    };
    
    // Add refund info if applicable
    if (status === 'disapproved' && order.paymentStatus === 'refunded') {
      response.refunded = true;
      response.refundAmount = order.refundAmount;
      response.refundDate = order.refundDate;
      response.message += ` and payment refunded (Rs. ${order.refundAmount})`;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error("\n❌ ERROR updating order status:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to update order status",
      error: error.message 
    });
  }
});

// ============================================
// 3. UPDATE ORDER STATUS (PUT endpoint)
// ============================================
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;
    
    const order = await SellerOrder.findById(id);
    if (!order) {
      return res.status(404).json({ 
        status: "error", 
        message: "Order not found" 
      });
    }
    
    // Prevent changing status if already approved/disapproved
    if (order.status !== 'pending' && status !== order.status) {
      return res.status(400).json({ 
        status: "error", 
        message: `Order already ${order.status}` 
      });
    }
    
    const previousStatus = order.status;
    
    // Handle disapproval with refund
    if (status === 'disapproved' && order.paymentStatus === 'paid') {
      const seller = await Seller.findById(order.sellerId);
      if (seller && order.paymentMethod === 'wallet') {
        const refundAmount = order.paidAmount || order.price;
        seller.walletBalance += refundAmount;
        seller.totalRefunded = (seller.totalRefunded || 0) + refundAmount;
        await seller.save();
        
        // Create refund transaction
        const transaction = new Transaction({
          userId: order.sellerId,
          userType: 'seller',
          type: 'credit',
          paymentMethod: 'wallet',
          amount: refundAmount,
          description: `Refund for disapproved order: ${order.item}`,
          balanceBefore: seller.walletBalance - refundAmount,
          balanceAfter: seller.walletBalance,
          status: 'completed',
          relatedOrder: id,
          isRefund: true,
          refundReason: reason || 'Order disapproved',
          transactionDate: new Date()
        });
        await transaction.save();
        
        order.paymentStatus = 'refunded';
        order.refundDate = new Date();
        order.refundAmount = refundAmount;
      }
    }
    
    order.status = status;
    order.disapprovalReason = reason || order.disapprovalReason;
    order.farmerNotes = notes || order.farmerNotes;
    order.statusUpdatedAt = new Date();
    
    if (status === 'approved') {
      order.farmerApprovalDate = new Date();
    } else if (status === 'disapproved') {
      order.farmerDisapprovalDate = new Date();
    }
    
    await order.save();
    
    res.json({ 
      status: "ok", 
      message: `Order ${status} successfully`,
      order: order
    });
    
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to update order" 
    });
  }
});

// ============================================
// 4. GET SELLER'S ORDERS
// ============================================
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, paymentStatus, limit = 100 } = req.query;
    
    const query = { sellerId };
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const orders = await SellerOrder.find(query)
      .populate('farmerId', 'fname lname email mobile')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ 
      status: "ok", 
      count: orders.length,
      orders: orders 
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch orders" 
    });
  }
});

// ============================================
// 5. GET FARMER'S ORDERS
// ============================================
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { status, paymentStatus, limit = 100 } = req.query;
    
    const query = { farmerId };
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const orders = await SellerOrder.find(query)
      .populate('sellerId', 'fname lname email mobile company')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ 
      status: "ok", 
      count: orders.length,
      orders: orders 
    });
  } catch (error) {
    console.error("Error fetching farmer orders:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch orders" 
    });
  }
});

// ============================================
// 6. GET PENDING ORDERS FOR FARMER
// ============================================
router.get('/farmer/:farmerId/pending', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const orders = await SellerOrder.find({
      farmerId: farmerId,
      status: 'pending',
      paymentStatus: 'paid'
    })
      .populate('sellerId', 'fname lname email mobile company')
      .sort({ createdAt: -1 });
    
    res.json({ 
      status: "ok", 
      count: orders.length,
      orders: orders 
    });
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to fetch pending orders" 
    });
  }
});

module.exports = router;