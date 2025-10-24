const router = require("express").Router();
const Notification = require("../model/notificationModel");

// Get all notifications for a specific seller
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      sellerId: req.params.sellerId,
    })
      .sort({ createdAt: -1 })
      .populate("farmerId", "name")
      .populate("orderId");

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread notifications for a seller
router.get("/seller/:sellerId/unread", async (req, res) => {
  try {
    const notifications = await Notification.find({
      sellerId: req.params.sellerId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .populate("farmerId", "name")
      .populate("orderId");

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark a notification as read
router.put("/:notificationId/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read for a seller
router.put("/seller/:sellerId/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { sellerId: req.params.sellerId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a notification when farmer disapproves an order
router.post("/", async (req, res) => {
  try {
    const newNotification = new Notification(req.body);
    await newNotification.save();

    res.status(201).json({ 
      message: "Notification created successfully", 
      notification: newNotification 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a notification
router.delete("/:notificationId", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(
      req.params.notificationId
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;