// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String, // e.g., 'farmer', 'seller', 'deliveryman'
  // add other fields as needed
});

module.exports = mongoose.model("User", userSchema);