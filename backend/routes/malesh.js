const express = require("express");
const router = express.Router();
const SellerOrder = require("../model/SellerOrder");
const Deliveryman = require("../model/Deliveryman");
const mongoose = require("mongoose");

// ==================== GET all seller orders with deliveryman info ====================
router.get("/", async (req, res) => {
  try {
    console.log("📥 Fetching all seller orders...");
    let orders = await SellerOrder.find()
      .populate("deliverymanId", "fname lname email mobile")
      .lean()
      .exec();
    
    console.log(`✅ Found ${orders.length} orders with populated deliveryman info`);
    res.json(orders);
  } catch (err) {
    console.error("❌ Error in GET /sellerorder:", err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
});

// ==================== GET single order by ID ====================
router.get("/:id", async (req, res) => {
  try {
    console.log(`📥 Fetching order ${req.params.id}`);
    const order = await SellerOrder.findById(req.params.id)
      .populate("deliverymanId", "fname lname email mobile")
      .lean()
      .exec();
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    console.log("✅ Order found");
    res.json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== PUT - deliveryman accepts the order ====================
router.put("/:id/accept", async (req, res) => {
  try {
    console.log(`🚀 Accepting order ${req.params.id}`);
    const order = await SellerOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate deliverymanId
    if (!req.body.deliverymanId) {
      return res.status(400).json({ message: "Deliveryman ID is required" });
    }

    // Check if deliveryman exists
    const deliveryman = await Deliveryman.findById(req.body.deliverymanId);
    if (!deliveryman) {
      return res.status(404).json({ message: "Deliveryman not found" });
    }

    // Update order
    order.acceptedByDeliveryman = true;
    order.deliverymanId = req.body.deliverymanId;
    order.deliveryStatus = "approved";

    const savedOrder = await order.save();
    
    // Populate deliveryman info before sending response
    await savedOrder.populate("deliverymanId", "fname lname email mobile");
    
    console.log("✅ Order accepted and populated");
    res.json({ message: "Order accepted by deliveryman", order: savedOrder });
  } catch (err) {
    console.error("❌ Error accepting order:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== PUT - update delivery status ====================
router.put("/:id/status", async (req, res) => {
  try {
    console.log(`📦 Updating delivery status for order ${req.params.id}`);
    const { status } = req.body;
    
    // Validate status
    if (!["delivered", "not-delivered", "approved"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be 'delivered', 'not-delivered', or 'approved'" 
      });
    }

    const order = await SellerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order has been accepted by a deliveryman
    if (!order.acceptedByDeliveryman) {
      return res.status(400).json({ 
        message: "Order must be accepted by a deliveryman first" 
      });
    }

    order.deliveryStatus = status;
    await order.save();
    await order.populate("deliverymanId", "fname lname email mobile");

    console.log(`✅ Delivery status updated to ${status}`);
    res.json({ message: `Order marked as ${status}`, order });
  } catch (err) {
    console.error("❌ Error updating delivery status:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== PUT - farmer updates order status (approve/disapprove) ====================
router.put("/update/:id", async (req, res) => {
  try {
    console.log(`✏️ Updating order status for ${req.params.id}`);
    const { status } = req.body;

    // Validate status
    if (!["approved", "disapproved", "pending"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be 'approved', 'disapproved', or 'pending'" 
      });
    }

    const order = await SellerOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();
    await order.populate("deliverymanId", "fname lname email mobile");

    console.log(`✅ Order status updated to ${status}`);
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== DELETE - delete an order ====================
router.delete("/:id", async (req, res) => {
  try {
    console.log(`🗑️ Deleting order ${req.params.id}`);
    const order = await SellerOrder.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    console.log("✅ Order deleted successfully");
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting order:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== GET orders by deliveryman ====================
router.get("/deliveryman/:deliverymanId", async (req, res) => {
  try {
    console.log(`📥 Fetching orders for deliveryman ${req.params.deliverymanId}`);
    const orders = await SellerOrder.find({ 
      deliverymanId: req.params.deliverymanId,
      acceptedByDeliveryman: true 
    })
    .populate("deliverymanId", "fname lname email mobile")
    .lean()
    .exec();
    
    console.log(`✅ Found ${orders.length} orders for this deliveryman`);
    res.json(orders);
  } catch (err) {
    console.error("❌ Error fetching deliveryman orders:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;