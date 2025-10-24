const mongoose = require("mongoose");

router.post("/applyscheme", authMiddleware, async (req, res) => {
  try {
    const { schemeId } = req.body;

    // Ensure scheme exists
    const schemeExists = await SchemeModel.findById(schemeId);
    if (!schemeExists) return res.status(404).json({ message: "Scheme not found" });

    const farmer = await FarmerModel.findById(req.farmer._id);

    // Convert schemeId to ObjectId for safety
    const schemeObjId = new mongoose.Types.ObjectId(schemeId);

    if (!farmer.appliedSchemes.includes(schemeObjId)) {
      farmer.appliedSchemes.push(schemeObjId);
      await farmer.save();
      return res.status(200).json({ message: "Scheme applied successfully" });
    } else {
      return res.status(400).json({ message: "Already applied for this scheme" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
