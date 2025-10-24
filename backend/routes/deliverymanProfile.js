const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Deliveryman = require("../model/Deliveryman");

// Middleware to verify JWT from cookie
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token; // cookie set during login
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// GET /deliverymanProfile/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const deliveryman = await Deliveryman.findById(req.userId).select("-password");
    if (!deliveryman) return res.status(404).json({ message: "Deliveryman not found" });
    res.json(deliveryman);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
