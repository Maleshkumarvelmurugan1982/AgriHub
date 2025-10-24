const router = require("express").Router();
const AppliedScheme = require("../model/AppliedScheme");

// Apply a scheme
router.post("/", async (req, res) => {
  try {
    const { userId, schemeId } = req.body;

    // Check if already applied
    const exists = await AppliedScheme.findOne({ userId, schemeId });
    if (exists) return res.status(400).json({ message: "Already applied" });

    const applied = new AppliedScheme({ userId, schemeId });
    await applied.save();
    res.status(201).json(applied);
  } catch (error) {
    console.error("Error applying scheme:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get applied schemes for a farmer
router.get("/:userId", async (req, res) => {
  try {
    const applied = await AppliedScheme.find({ userId: req.params.userId }).populate("schemeId");
    const schemes = applied.map(a => a.schemeId);
    res.json(schemes);
  } catch (error) {
    console.error("Error fetching applied schemes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
