const express = require("express");
const router = express.Router();
const SellerOrder = require("../model/SellerOrder"); // Your Mongoose model

// ========================================
// SELLER ROUTES (Orders created by seller)
// ========================================

// ✅ GET all orders for a specific SELLER
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const orders = await SellerOrder.find({ sellerId })
      .populate('farmerId', 'fname lname email mobile district')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 }); // Latest first
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch seller orders", 
      error: error.message 
    });
  }
});

// ✅ GET seller orders by status
router.get("/seller/:sellerId/status/:status", async (req, res) => {
  try {
    const { sellerId, status } = req.params;
    
    const orders = await SellerOrder.find({ sellerId, status })
      .populate('farmerId', 'fname lname email mobile')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching seller orders by status:", error);
    res.status(500).json({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
});

// ========================================
// FARMER ROUTES (Orders sent to farmer)
// ========================================

// ✅ GET all orders for a specific FARMER (orders sent to them)
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const orders = await SellerOrder.find({ farmerId })
      .populate('sellerId', 'name email mobile district')
      .populate('deliverymanId', 'fname lname email mobile')
      .sort({ createdAt: -1 }); // Latest first
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching farmer orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch farmer orders", 
      error: error.message 
    });
  }
});

// ✅ GET pending orders for farmer (awaiting approval)
router.get("/farmer/:farmerId/pending", async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const orders = await SellerOrder.find({ farmerId, status: "pending" })
      .populate('sellerId', 'name email mobile')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching pending farmer orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch pending orders", 
      error: error.message 
    });
  }
});

// ✅ UPDATE order status (farmer approves/disapproves)
router.put("/update/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, farmerNotes } = req.body;
    
    // Validate status
    if (!["approved", "disapproved", "pending"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be 'approved', 'disapproved', or 'pending'" 
      });
    }
    
    const updateData = { status };
    if (farmerNotes) updateData.farmerNotes = farmerNotes;
    if (status === "approved" || status === "disapproved") {
      updateData.farmerApprovalDate = new Date();
    }
    
    const order = await SellerOrder.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('sellerId', 'name email mobile')
      .populate('farmerId', 'fname lname email mobile')
      .populate('deliverymanId', 'fname lname email mobile');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ 
      message: `Order ${status} successfully`, 
      order 
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ 
      message: "Failed to update order", 
      error: error.message 
    });
  }
});

// ========================================
// DELIVERYMAN ROUTES
// ========================================

// ✅ GET available orders for deliveryman (approved, not yet accepted)
router.get("/deliveryman/available", async (req, res) => {
  try {
    const orders = await SellerOrder.find({ 
      status: 'approved', 
      acceptedByDeliveryman: false 
    })
      .populate('sellerId', 'name email mobile district')
      .populate('farmerId', 'fname lname email mobile district')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching available delivery orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch available orders", 
      error: error.message 
    });
  }
});

// ✅ GET orders assigned to a specific deliveryman
router.get("/deliveryman/:deliverymanId", async (req, res) => {
  try {
    const { deliverymanId } = req.params;
    
    const orders = await SellerOrder.find({ deliverymanId })
      .populate('sellerId', 'name email mobile district address')
      .populate('farmerId', 'fname lname email mobile district address')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching deliveryman orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch deliveryman orders", 
      error: error.message 
    });
  }
});

// ✅ ACCEPT order by deliveryman (UPDATED from your existing route)
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
    order.deliveryStatus = "in-transit"; // Changed from "approved" to "in-transit"
    if (deliveryNotes) order.deliveryNotes = deliveryNotes;
    
    await order.save();
    
    // Populate before sending response
    await order.populate('sellerId', 'name email mobile');
    await order.populate('farmerId', 'fname lname email mobile');
    await order.populate('deliverymanId', 'fname lname email mobile');
    
    res.json({ 
      message: "Order accepted by deliveryman successfully", 
      order 
    });
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ 
      message: "Failed to accept order", 
      error: error.message 
    });
  }
});

// ✅ UPDATE delivery status (UPDATED from your existing route)
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
    await order.populate('sellerId', 'name email mobile');
    await order.populate('farmerId', 'fname lname email mobile');
    await order.populate('deliverymanId', 'fname lname email mobile');
    
    res.json({ 
      message: `Order marked as ${status}`, 
      order 
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ 
      message: "Failed to update delivery status", 
      error: error.message 
    });
  }
});

// ========================================
// GENERAL ROUTES
// ========================================

// ✅ GET all orders (admin/testing - UPDATED with data migration fix)
router.get("/", async (req, res) => {
  try {
    const orders = await SellerOrder.find()
      .populate('sellerId', 'name email')
      .populate('farmerId', 'fname lname email')
      .populate('deliverymanId', 'fname lname email')
      .sort({ createdAt: -1 })
      .limit(100); // Limit for performance
    
    // ✅ FIX: Migrate old data - if acceptedByDeliveryman is true but deliveryStatus is pending
    const fixedOrders = orders.map(order => {
      const orderObj = order.toObject();
      if (orderObj.acceptedByDeliveryman === true && orderObj.deliveryStatus === "pending") {
        orderObj.deliveryStatus = "in-transit";
      }
      return orderObj;
    });
    
    res.json(fixedOrders);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
});

// ✅ CREATE new seller order
router.post("/", async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }
    if (!orderData.farmerId) {
      return res.status(400).json({ message: "Farmer ID is required" });
    }
    if (!orderData.item) {
      return res.status(400).json({ message: "Item is required" });
    }
    if (!orderData.quantity) {
      return res.status(400).json({ message: "Quantity is required" });
    }
    
    const newOrder = new SellerOrder(orderData);
    await newOrder.save();
    
    await newOrder.populate('sellerId', 'name email mobile');
    await newOrder.populate('farmerId', 'fname lname email mobile');
    
    res.status(201).json({ 
      message: "Order created successfully", 
      order: newOrder 
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ 
      message: "Failed to create order", 
      error: error.message 
    });
  }
});

// ✅ GET single order by ID
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await SellerOrder.findById(orderId)
      .populate('sellerId', 'name email mobile district address')
      .populate('farmerId', 'fname lname email mobile district address')
      .populate('deliverymanId', 'fname lname email mobile');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ 
      message: "Failed to fetch order", 
      error: error.message 
    });
  }
});

// ✅ DELETE order (should be restricted in production)
router.delete("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await SellerOrder.findByIdAndDelete(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ 
      message: "Order deleted successfully", 
      order 
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ 
      message: "Failed to delete order", 
      error: error.message 
    });
  }
});

module.exports = router;