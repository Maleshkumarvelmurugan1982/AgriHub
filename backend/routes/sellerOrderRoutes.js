const express = require("express");
const router = express.Router();
const SellerOrder = require("../model/SellerOrder"); // Your Mongoose model

// ==================== Existing Routes ====================

// GET all seller orders
router.get("/", async (req, res) => {
  try {
    const orders = await SellerOrder.find();
    
    // ✅ FIX: Migrate old data - if acceptedByDeliveryman is true but deliveryStatus is pending, set it to approved
    const fixedOrders = orders.map(order => {
      if (order.acceptedByDeliveryman === true && order.deliveryStatus === "pending") {
        return { ...order.toObject(), deliveryStatus: "approved" };
      }
      return order;
    });
    
    res.json(fixedOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - deliveryman accepts the order
router.put("/:id/accept", async (req, res) => {
  try {
    const order = await SellerOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.acceptedByDeliveryman = true;
    order.deliverymanId = req.body.deliverymanId; // optional: store who accepted
    order.deliveryStatus = "approved"; // ✅ Mark as approved when accepted
    
    await order.save(); // ✅ Make sure to save!

    res.json({ message: "Order accepted by deliveryman", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== NEW Route ====================

// PUT - update delivery status (delivered / not-delivered)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // expected: "delivered" or "not-delivered"
    if (!["delivered", "not-delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await SellerOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.deliveryStatus = status; // persist status in backend
    await order.save();

    res.json({ message: `Order marked as ${status}`, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;