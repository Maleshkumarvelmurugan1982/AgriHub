const mongoose = require("mongoose");

const SchemeModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
});

module.exports = mongoose.model("SchemeModel", SchemeModelSchema);
