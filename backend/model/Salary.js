const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  deliverymanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deliveryman",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Salary", salarySchema);
