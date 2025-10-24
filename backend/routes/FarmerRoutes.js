const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const FarmerModel = require("../model/FarmerModel");
const SchemeModel = require("../model/SchemeModel");

// JWT auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret-key");
    const farmer = await FarmerModel.findById(decoded.farmerId);
    if (!farmer) return res.status(401).json({ message: "Farmer not found" });

    req.farmer = farmer;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET farmer info
router.get("/farmerinfo", authMiddleware, async (req, res) => {
  try {
    const farmer = await FarmerModel.findById(req.farmer._id).populate("appliedSchemes");
    res.json({
      _id: farmer._id,
      name: farmer.name,
      email: farmer.email,
      appliedSchemes: farmer.appliedSchemes.map((s) => s._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST apply scheme
router.post("/applyscheme", authMiddleware, async (req, res) => {
  try {
    const { schemeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(schemeId))
      return res.status(400).json({ message: "Invalid scheme ID" });

    const scheme = await SchemeModel.findById(schemeId);
    if (!scheme) return res.status(404).json({ message: "Scheme not found" });

    const farmer = await FarmerModel.findById(req.farmer._id);

    if (!farmer.appliedSchemes.some((id) => id.toString() === schemeId)) {
      farmer.appliedSchemes.push(schemeId);
      await farmer.save();
      return res.status(200).json({ message: "Scheme applied successfully" });
    } else {
      return res.status(400).json({ message: "Already applied" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
