const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const deliverymanSchema = new Schema({
  fname: String,
  lname: String,
  email: String,
  district: String,
  password: String,
  primaryKey: { type: String, unique: true },
  salary: { type: Number, default: 0 }, // ✅ add salary
});

// ✅ Prevent OverwriteModelError
module.exports =
  mongoose.models.DeliveryMan ||
  mongoose.model("DeliveryMan", deliverymanSchema);
