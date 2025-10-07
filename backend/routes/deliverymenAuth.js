const express = require("express");
const router = express.Router();
const DeliveryMen = require("../model/DeliveryMen"); // adjust path if needed

// Route to get the currently logged-in deliveryman info
router.get("/me", async (req, res) => {
  try {
    // Get deliveryman ID from session
    const deliverymanId = req.session.deliverymanId;

    if (!deliverymanId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const deliveryman = await DeliveryMen.findById(deliverymanId);

    if (!deliveryman) {
      return res.status(404).json({ message: "Deliveryman not found" });
    }

    res.json({
      deliverymanId: deliveryman._id,
      name: deliveryman.name,
      email: deliveryman.email,
      salary: deliveryman.salary || 0, // initial salary if not set
    });
  } catch (error) {
    console.error("Error fetching deliveryman info:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
