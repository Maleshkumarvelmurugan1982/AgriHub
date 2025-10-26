const express = require("express");
const router = express.Router();
const Application = require("../model/Application");

// Submit a new application
router.post("/", async (req, res) => {
  try {
    const { schemeId, schemeName, farmerName, contact, details } = req.body;

    if (!schemeId || !schemeName || !farmerName || !contact || !details) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newApplication = new Application({
      schemeId,
      schemeName,
      farmerName,
      contact,
      details,
    });

    await newApplication.save();
    res.json({ message: "Application submitted successfully", newApplication });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
