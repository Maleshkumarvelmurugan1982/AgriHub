const express = require("express");
const router = express.Router();
const DeliveryMen = require("../model/DeliveryMen");

// GET /deliverymen
router.get("/", async (req, res) => {
  try {
    const deliveryMen = await DeliveryMen.find();
    res.json(deliveryMen);
  } catch (err) {
    console.error("Failed to fetch delivery men:", err);
    res.status(500).json({ error: "Failed to fetch delivery men" });
  }
});

// PUT /deliverymen/:id/salary - update salary
router.put("/:id/salary", async (req, res) => {
  const { id } = req.params;
  const { salary } = req.body;

  // Validate salary presence
  if (salary === undefined || salary === null) {
    return res.status(400).json({ error: "Salary is required" });
  }

  // Validate salary type
  if (typeof salary !== "number" || isNaN(salary) || salary <= 0) {
    return res.status(400).json({ error: "Salary must be a positive number" });
  }

  try {
    const deliveryMan = await DeliveryMen.findById(id);

    if (!deliveryMan) {
      return res.status(404).json({ error: "Delivery man not found" });
    }

    deliveryMan.salary = salary;
    await deliveryMan.save();

    res.json(deliveryMan);
  } catch (err) {
    console.error("Error updating salary:", err);
    res.status(500).json({ error: "Failed to update salary", details: err.message });
  }
});

// DELETE /deliverymen/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await DeliveryMen.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ error: "Delivery man not found" });

    res.json({ message: "Delivery man deleted successfully" });
  } catch (err) {
    console.error("Failed to delete delivery man:", err);
    res.status(500).json({ error: "Failed to delete delivery man" });
  }
});

module.exports = router;