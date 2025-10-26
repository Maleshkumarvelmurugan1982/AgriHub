const express = require("express");
const router = express.Router();
const SchemeModel = require("../model/SchemeModel");

// GET all schemes
router.get("/allschemes", async (req, res) => {
  try {
    const schemes = await SchemeModel.find();
    res.json(schemes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
