const express = require("express");
const router = express.Router();
const Salary = require("../model/Salary");

// GET salary by deliveryman ID
router.get("/:deliverymanId", async (req, res) => {
  try {
    const salary = await Salary.findOne({ deliverymanId: req.params.deliverymanId });
    
    if (!salary) {
      // Return 0 instead of 404 so frontend can handle gracefully
      return res.status(200).json({ salary: 0, message: "Salary not set yet" });
    }
    
    res.json({ salary: salary.amount });
  } catch (error) {
    console.error("Error fetching salary:", error);
    res.status(500).json({ message: "Server error", salary: 0 });
  }
});

// POST - Create or update salary for deliveryman
router.post("/", async (req, res) => {
  try {
    const { deliverymanId, amount } = req.body;
    
    if (!deliverymanId || amount === undefined) {
      return res.status(400).json({ message: "deliverymanId and amount are required" });
    }

    // Find existing salary or create new one
    let salary = await Salary.findOne({ deliverymanId });
    
    if (salary) {
      // Update existing salary
      salary.amount = amount;
      await salary.save();
      res.json({ message: "Salary updated successfully", salary: salary.amount });
    } else {
      // Create new salary record
      salary = new Salary({ deliverymanId, amount });
      await salary.save();
      res.status(201).json({ message: "Salary created successfully", salary: salary.amount });
    }
  } catch (error) {
    console.error("Error creating/updating salary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT - Update salary for deliveryman
router.put("/:deliverymanId", async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (amount === undefined) {
      return res.status(400).json({ message: "Amount is required" });
    }

    let salary = await Salary.findOne({ deliverymanId: req.params.deliverymanId });
    
    if (!salary) {
      // Create new if doesn't exist
      salary = new Salary({ deliverymanId: req.params.deliverymanId, amount });
      await salary.save();
      return res.status(201).json({ message: "Salary created successfully", salary: salary.amount });
    }
    
    salary.amount = amount;
    await salary.save();
    res.json({ message: "Salary updated successfully", salary: salary.amount });
  } catch (error) {
    console.error("Error updating salary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE salary record
router.delete("/:deliverymanId", async (req, res) => {
  try {
    const salary = await Salary.findOneAndDelete({ deliverymanId: req.params.deliverymanId });
    
    if (!salary) {
      return res.status(404).json({ message: "Salary not found" });
    }
    
    res.json({ message: "Salary deleted successfully" });
  } catch (error) {
    console.error("Error deleting salary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;