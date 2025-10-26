const mongoose = require("mongoose");

const deliveryOrderSchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  productImage: String,
  sellerId: String,           // needed to notify the seller
  status: { type: String, default: "approved" }, // approved, taken
  deliverymanId: String,
  deliverymanName: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeliveryOrder", deliveryOrderSchema);
