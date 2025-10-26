const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Scheme = require("../model/Scheme");
const AppliedScheme = require("../model/AppliedScheme");
const Farmer = require("../model/Farmer");

// Get all schemes
router.get("/", async (req, res) => {
  try {
    const schemes = await Scheme.find();
    res.json(schemes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add new scheme
router.post("/", async (req, res) => {
  try {
    const scheme = new Scheme({ name: req.body.name });
    await scheme.save();
    res.json(scheme);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add scheme" });
  }
});

// Update scheme
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid scheme ID" });

  try {
    const updatedScheme = await Scheme.findByIdAndUpdate(
      id,
      { name: req.body.name },
      { new: true }
    );
    res.json(updatedScheme);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update scheme" });
  }
});

// Delete scheme
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid scheme ID" });

  try {
    await Scheme.findByIdAndDelete(id);
    res.json({ message: "Scheme deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete scheme" });
  }
});

// GET applicants for a scheme (only farmers)
router.get("/:id/applicants", async (req, res) => {
  const { id: schemeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(schemeId))
    return res.status(400).json({ error: "Invalid scheme ID" });

  try {
    const appliedSchemes = await AppliedScheme.find({ schemeId });

    const result = await Promise.all(
      appliedSchemes.map(async (app) => {
        const farmer = await Farmer.findById(app.userId);
        if (!farmer) return null;
        return {
          username: `${farmer.fname} ${farmer.lname}`, // display full name
          role: farmer.role || "farmer",
        };
      })
    );

    res.json(result.filter((f) => f !== null));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
