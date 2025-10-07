const express = require("express");
const router = express.Router();
const Salary = require("../model/Salary");

// GET salary by deliveryman ID
router.get("/:deliverymanId", async (req, res) => {
  try {
    const salary = await Salary.findOne({ deliverymanId: req.params.deliverymanId });
    if (!salary) return res.status(404).json({ message: "Salary not found" });
    res.json({ salary: salary.amount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
