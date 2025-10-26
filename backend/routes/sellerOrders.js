const router = require("express").Router();
const SellerOrder = require("../model/SellerOrder");
const Product = require("../model/Product");

// ========================================
// SELLER ROUTES (Orders created by seller)
// ========================================

// ✅ NEW: Get all orders for a specific SELLER
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`📦 Fetching orders for seller: ${sellerId}`);
    
    const orders = await SellerOrder.find({ sellerId })
      .populate('farmerId', 'fname lname email mobile district')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 }); // Latest first
    
    console.log(`✅ Found ${orders.length} orders for seller ${sellerId}`);
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching seller orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch seller orders", 
      error: error.message 
    });
  }
});

// ✅ NEW: Get seller orders by status
router.get("/seller/:sellerId/status/:status", async (req, res) => {
  try {
    const { sellerId, status } = req.params;
    
    const orders = await SellerOrder.find({ sellerId, status })
      .populate('farmerId', 'fname lname email mobile')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching seller orders by status:", error);
    res.status(500).json({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
});

// ========================================
// FARMER ROUTES (Orders sent to farmer)
// ========================================

// ✅ EXISTING: Get seller orders for a specific farmer
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    console.log('🔍 Fetching orders for farmer:', farmerId);
    
    const orders = await SellerOrder.find({ farmerId: farmerId })
      .populate('deliverymanId', 'fname lname email mobile')
      .populate('sellerId', 'fname lname email mobile district') // ✅ Also populate seller info
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${orders.length} orders for farmer ${farmerId}`);
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('❌ Error fetching farmer orders:', error);
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error.message 
    });
  }
});

// ✅ NEW: Get pending orders for farmer (awaiting approval)
router.get("/farmer/:farmerId/pending", async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const orders = await SellerOrder.find({ farmerId, status: "pending" })
      .populate('sellerId', 'fname lname email mobile')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching pending farmer orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch pending orders", 
      error: error.message 
    });
  }
});

// ✅ EXISTING: Get order statistics for a specific farmer
router.get("/farmer/:farmerId/stats", async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const totalOrders = await SellerOrder.countDocuments({ farmerId });
    const approvedOrders = await SellerOrder.countDocuments({ 
      farmerId, 
      status: 'approved' 
    });
    const pendingOrders = await SellerOrder.countDocuments({ 
      farmerId, 
      status: 'pending' 
    });
    const disapprovedOrders = await SellerOrder.countDocuments({ 
      farmerId, 
      status: 'disapproved' 
    });
    
    res.status(200).json({
      total: totalOrders,
      approved: approvedOrders,
      pending: pendingOrders,
      disapproved: disapprovedOrders
    });
  } catch (error) {
    console.error('❌ Error fetching order stats:', error);
    res.status(500).json({ 
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
});

// ========================================
// DELIVERYMAN ROUTES
// ========================================

// ✅ NEW: Get available orders for deliveryman (approved, not yet accepted)
router.get("/deliveryman/available", async (req, res) => {
  try {
    const orders = await SellerOrder.find({ 
      status: 'approved', 
      acceptedByDeliveryman: false 
    })
      .populate('sellerId', 'fname lname email mobile district')
      .populate('farmerId', 'fname lname email mobile district')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching available delivery orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch available orders", 
      error: error.message 
    });
  }
});

// ✅ NEW: Get orders assigned to a specific deliveryman
router.get("/deliveryman/:deliverymanId", async (req, res) => {
  try {
    const { deliverymanId } = req.params;
    
    const orders = await SellerOrder.find({ deliverymanId })
      .populate('sellerId', 'fname lname email mobile district address')
      .populate('farmerId', 'fname lname email mobile district address')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching deliveryman orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch deliveryman orders", 
      error: error.message 
    });
  }
});

// ✅ NEW: ACCEPT order by deliveryman
router.put("/:id/accept", async (req, res) => {
  try {
    const { deliverymanId, deliveryNotes } = req.body;
    
    if (!deliverymanId) {
      return res.status(400).json({ message: "Deliveryman ID is required" });
    }
    
    const order = await SellerOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.status !== "approved") {
      return res.status(400).json({ 
        message: "Order must be approved by farmer before deliveryman can accept" 
      });
    }
    
    if (order.acceptedByDeliveryman) {
      return res.status(400).json({ 
        message: "Order already accepted by another deliveryman" 
      });
    }
    
    order.acceptedByDeliveryman = true;
    order.deliverymanId = deliverymanId;
    order.deliveryAcceptedDate = new Date();
    order.deliveryStatus = "in-transit";
    if (deliveryNotes) order.deliveryNotes = deliveryNotes;
    
    await order.save();
    
    // Populate before sending response
    await order.populate('sellerId', 'fname lname email mobile');
    await order.populate('farmerId', 'fname lname email mobile');
    await order.populate('deliverymanId', 'fname lname email mobile');
    
    res.json({ 
      message: "Order accepted by deliveryman successfully", 
      order 
    });
  } catch (error) {
    console.error("❌ Error accepting order:", error);
    res.status(500).json({ 
      message: "Failed to accept order", 
      error: error.message 
    });
  }
});

// ✅ NEW: UPDATE delivery status
router.put("/:id/status", async (req, res) => {
  try {
    const { status, deliveryNotes } = req.body;
    
    // Validate delivery status
    if (!["pending", "in-transit", "delivered", "not-delivered"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be 'pending', 'in-transit', 'delivered', or 'not-delivered'" 
      });
    }
    
    const order = await SellerOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    order.deliveryStatus = status;
    if (deliveryNotes) order.deliveryNotes = deliveryNotes;
    if (status === "delivered") {
      order.deliveryCompletedDate = new Date();
    }
    
    await order.save();
    
    // Populate before sending response
    await order.populate('sellerId', 'fname lname email mobile');
    await order.populate('farmerId', 'fname lname email mobile');
    await order.populate('deliverymanId', 'fname lname email mobile');
    
    res.json({ 
      message: `Order marked as ${status}`, 
      order 
    });
  } catch (error) {
    console.error("❌ Error updating delivery status:", error);
    res.status(500).json({ 
      message: "Failed to update delivery status", 
      error: error.message 
    });
  }
});

// ========================================
// GENERAL ROUTES
// ========================================

// ✅ EXISTING: Get all seller orders
router.get("/", (req, res) => {
  SellerOrder.find()
    .populate('deliverymanId')
    .populate('farmerId')
    .populate('sellerId', 'fname lname email') // ✅ Also populate seller
    .then(orders => {
      // ✅ FIX: Migrate old data
      const fixedOrders = orders.map(order => {
        const orderObj = order.toObject();
        if (orderObj.acceptedByDeliveryman === true && orderObj.deliveryStatus === "pending") {
          orderObj.deliveryStatus = "in-transit";
        }
        return orderObj;
      });
      res.json(fixedOrders);
    })
    .catch(err => res.status(500).send({ status: "Error fetching seller orders" }));
});

// ✅ UPDATED: Add new seller order with payment information
router.post("/add", async (req, res) => {
  try {
    const {
      name, item, productImage, category, quantity, price,
      district, company, mobile, land, email, address, postedDate, expireDate,
      farmerId,      // ✅ CRITICAL: Farmer who owns the product
      sellerId,      // ✅ CRITICAL: Seller who is placing the order
      paymentMethod, // ✅ NEW: Payment method (wallet/card)
      paymentStatus, // ✅ NEW: Payment status (completed/pending)
      isPaid         // ✅ NEW: Payment flag
    } = req.body;
    
    console.log("📝 Creating order with data:", req.body);
    console.log("💰 Received Payment Info:");
    console.log("   - paymentMethod:", paymentMethod);
    console.log("   - paymentStatus:", paymentStatus);
    console.log("   - isPaid:", isPaid);
    
    // ✅ Validate required fields
    if (!farmerId) {
      console.error("❌ Missing farmerId in request");
      return res.status(400).json({ 
        message: 'Farmer ID is required',
        error: 'Missing farmerId field' 
      });
    }
    
    if (!sellerId) {
      console.error("❌ Missing sellerId in request");
      return res.status(400).json({ 
        message: 'Seller ID is required',
        error: 'Missing sellerId field' 
      });
    }
    
    // Determine payment status based on method and isPaid flag
    let finalPaymentStatus = "pending";
    let finalPaidAmount = 0;
    let finalPaymentDate = null;
    
    if (paymentMethod === "wallet" && (isPaid === true || paymentStatus === "completed")) {
      finalPaymentStatus = "paid";
      finalPaidAmount = Number(price) || 0;
      finalPaymentDate = new Date();
    } else if (paymentMethod === "card") {
      finalPaymentStatus = "pending";
      finalPaidAmount = 0;
      finalPaymentDate = null;
    }
    
    console.log("✅ Final Payment Details:");
    console.log("   - Status:", finalPaymentStatus);
    console.log("   - Amount:", finalPaidAmount);
    console.log("   - Date:", finalPaymentDate);
    
    const newOrder = new SellerOrder({
      name: name || "",
      item, 
      productImage, 
      category, 
      quantity, 
      price,
      district, 
      company, 
      mobile, 
      email, 
      address, 
      postedDate: postedDate || new Date().toISOString().split('T')[0],
      expireDate,
      farmerId,           // ✅ CRITICAL: Store farmerId
      sellerId,           // ✅ CRITICAL: Store sellerId
      status: "pending",
      deliverymanId: null,
      acceptedByDeliveryman: false,
      deliveryStatus: "pending",
      // ✅ Payment fields (matching model schema)
      paymentMethod: paymentMethod || "wallet",
      paymentStatus: finalPaymentStatus,
      paidAmount: finalPaidAmount,
      paymentDate: finalPaymentDate,
      refundAmount: 0,
      refundDate: null
    });
    
    const savedOrder = await newOrder.save();
    
    console.log("✅ Order created successfully!");
    console.log("💰 Saved Payment Info:");
    console.log("   - Method:", savedOrder.paymentMethod);
    console.log("   - Status:", savedOrder.paymentStatus);
    console.log("   - Amount:", savedOrder.paidAmount);
    console.log("   - Date:", savedOrder.paymentDate);
    
    // ✅ Reduce product quantity when order is placed
    try {
      // Try to find product by productName field
      let product = await Product.findOne({ productName: item });
      
      // If not found, try by name field (fallback)
      if (!product) {
        product = await Product.findOne({ name: item });
      }
      
      if (product) {
        console.log("🔍 Found product:", product.productName || product.name);
        console.log("   Current quantity:", product.quantity);
        
        if (product.quantity >= quantity) {
          product.quantity -= quantity;
          await product.save();
          console.log(`✅ Product quantity reduced by ${quantity} kg`);
          console.log(`   New quantity: ${product.quantity} kg`);
        } else {
          console.error("❌ Insufficient product quantity");
        }
      } else {
        console.error("❌ Product not found for quantity reduction:", item);
      }
    } catch (err) {
      console.error("❌ Error reducing product quantity:", err);
    }
    
    res.status(201).json({ 
      message: "New Seller Order added successfully!",
      order: savedOrder
    });
  } catch (err) {
    console.error("❌ Error adding order:", err);
    res.status(500).json({ 
      status: "Error adding seller order",
      error: err.message 
    });
  }
});

// ✅ EXISTING: UPDATE order (Approve / Disapprove & Reduce Product Quantity if approved)
router.put("/update/:id", async (req, res) => {
  const orderId = req.params.id;
  const { status, deliveryStatus, acceptedByDeliveryman, deliverymanId, farmerNotes } = req.body;
  
  console.log(`📝 Update request for order ${orderId}`);
  console.log("Update data:", req.body);
  
  try {
    const order = await SellerOrder.findById(orderId);
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.status(404).json({ status: "Order not found" });
    }
    
    console.log("✅ Order found:", order);
    
    // ❌ REMOVED: No longer reducing quantity on approval since it's already reduced on order creation
    // The quantity was already reduced when the order was placed
    if (status === "approved" && order.status !== "approved") {
      console.log("✅ Order approved by farmer (quantity already reduced at order time)");
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "approved" || status === "disapproved") {
        updateData.farmerApprovalDate = new Date();
      }
    }
    if (deliveryStatus !== undefined) updateData.deliveryStatus = deliveryStatus;
    if (acceptedByDeliveryman !== undefined) updateData.acceptedByDeliveryman = acceptedByDeliveryman;
    if (deliverymanId !== undefined) updateData.deliverymanId = deliverymanId;
    if (farmerNotes !== undefined) updateData.farmerNotes = farmerNotes;
    
    // Update the order
    const updatedOrder = await SellerOrder.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: false }
    )
      .populate('deliverymanId')
      .populate('sellerId', 'fname lname email mobile')
      .populate('farmerId', 'fname lname email mobile');
    
    console.log("✅ Order updated:", updatedOrder);
    
    res.status(200).json({ 
      message: `Order updated successfully`,
      order: updatedOrder 
    });
  } catch (err) {
    console.error("❌ Error updating seller order:", err);
    res.status(500).send({ 
      status: "Error updating seller order",
      error: err.message 
    });
  }
});

// ✅ EXISTING: Delete order
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await SellerOrder.findByIdAndDelete(req.params.id);
    
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ 
      message: "Order deleted successfully",
      order: deletedOrder
    });
  } catch (err) {
    console.error("❌ Error deleting order:", err);
    res.status(500).json({ 
      message: "Error deleting order",
      error: err.message 
    });
  }
});

// ✅ EXISTING: Get single order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await SellerOrder.findById(req.params.id)
      .populate('deliverymanId')
      .populate('farmerId')
      .populate('sellerId', 'fname lname email mobile');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).json({ 
      message: "Error fetching order",
      error: err.message 
    });
  }
});

module.exports = router;