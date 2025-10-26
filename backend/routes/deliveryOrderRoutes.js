const express = require("express");
const router = express.Router();
const DeliveryOrder = require("../model/DeliveryOrder");
const UserNotification = require("../model/UserNotification");

// Get all delivery orders
router.get("/", async (req, res) => {
  try {
    const orders = await DeliveryOrder.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign deliveryman (Accept order)
router.put("/assign/:id", async (req, res) => {
  const { deliverymanId, deliverymanName } = req.body;
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.deliverymanId = deliverymanId;
    order.deliverymanName = deliverymanName;
    order.status = "taken";
    await order.save();

    await UserNotification.create({
      userId: order.sellerId,
      message: `Your order "${order.item}" has been accepted by deliveryman ${deliverymanName}`,
    });

    res.json({ message: "Order assigned and seller notified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject order
router.put("/reject/:id", async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.deliverymanId = null;
    order.deliverymanName = null;
    order.status = "approved";
    await order.save();

    res.json({ message: "Order rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
