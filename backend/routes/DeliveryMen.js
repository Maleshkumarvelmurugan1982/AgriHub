const express = require("express");
const router = express.Router();
const DeliveryMen = require("../model/DeliveryMen");

// GET /deliverymen - get all delivery men
router.get("/", async (req, res) => {
  try {
    const deliveryMen = await DeliveryMen.find();
    res.json(deliveryMen);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch delivery men" });
  }
});

// POST /deliverymen - add new delivery man
router.post("/", async (req, res) => {
  const { name, salary } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const newDeliveryMan = new DeliveryMen({ name, salary });
    await newDeliveryMan.save();
    res.status(201).json(newDeliveryMan);
  } catch (err) {
    res.status(500).json({ error: "Failed to add delivery man" });
  }
});

// PUT /deliverymen/:id/salary - update salary
router.put("/:id/salary", async (req, res) => {
  const { id } = req.params;
  const { salary } = req.body;

  if (salary === undefined || salary === null)
    return res.status(400).json({ error: "Salary is required" });

  try {
    const deliveryMan = await DeliveryMen.findById(id);
    if (!deliveryMan)
      return res.status(404).json({ error: "Delivery man not found" });

    deliveryMan.salary = salary;
    await deliveryMan.save();

    res.json(deliveryMan);
  } catch (err) {
    res.status(500).json({ error: "Failed to update salary" });
  }
});

// DELETE /deliverymen/:id - delete delivery man
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await DeliveryMen.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ error: "Delivery man not found" });

    res.json({ message: "Delivery man deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete delivery man" });
  }
});

module.exports = router;
