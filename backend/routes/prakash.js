const express = require("express");
const router = express.Router();
const SellerOrder = require("../model/SellerOrder");
const DeliveryMen = require("../model/DeliveryMen");

// PUT - deliveryman accepts the order
router.put("/:id/accept", async (req, res) => {
  try {
    const order = await SellerOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Determine deliverymanId
    let deliverymanId = req.body.deliverymanId;

    // If deliverymanId is missing, fetch from DeliveryMen collection
    if (!deliverymanId) {
      // For example, using deliveryman email from request body
      const deliveryman = await DeliveryMen.findOne({ email: req.body.deliverymanEmail });
      if (!deliveryman) return res.status(404).json({ message: "Deliveryman not found in DB" });
      deliverymanId = deliveryman._id;
    }

    order.acceptedByDeliveryman = true;
    order.deliverymanId = deliverymanId;
    order.deliveryStatus = "approved";

    await order.save();

    res.json({ message: "Order accepted by deliveryman", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
