const express = require("express");
const router = express.Router();
const Scheme = require("../model/Scheme");

// Get all schemes
router.get("/", async (req, res) => {
  try {
    const schemes = await Scheme.find();
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new scheme
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Scheme name is required" });
    }

    const newScheme = new Scheme({ name });
    await newScheme.save();
    res.json(newScheme);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a scheme
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Scheme name is required" });
    }

    const updated = await Scheme.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Scheme not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a scheme
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Scheme.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Scheme not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
