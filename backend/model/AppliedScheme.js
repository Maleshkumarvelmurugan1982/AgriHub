const mongoose = require("mongoose");

const appliedSchemeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: "Scheme", required: true },
  appliedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AppliedScheme", appliedSchemeSchema);
