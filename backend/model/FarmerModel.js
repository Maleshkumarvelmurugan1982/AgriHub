const mongoose = require("mongoose");

const FarmerModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  appliedSchemes: [{ type: mongoose.Schema.Types.ObjectId, ref: "SchemeModel" }],
});

module.exports = mongoose.model("FarmerModel", FarmerModelSchema);
