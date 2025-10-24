import express from "express";
import Scheme from "../model/Scheme.js"; // MongoDB model

const router = express.Router();

// GET all schemes
router.get("/", async (req, res) => {
  try {
    const schemes = await Scheme.find();
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single scheme by ID
router.get("/:id", async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ message: "Scheme not found" });
    res.json(scheme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST application for a scheme
router.post("/:id/apply", async (req, res) => {
  try {
    const { name, farmId, contact } = req.body;
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ message: "Scheme not found" });

    // Here, just log the application. You can store in DB.
    console.log(`Application for scheme ${scheme.name}:`, { name, farmId, contact });
    
    res.json({ message: "Application submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
