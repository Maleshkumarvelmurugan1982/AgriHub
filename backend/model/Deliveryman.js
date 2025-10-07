const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const deliverymanSchema = new Schema({
  userRole: {
    type: String,
  },

  fname: {
    type: String,
  },

  lname: {
    type: String,
  },

  email: {
    type: String,
  },

  district: {
    type: String,
  },

  password: {
    type: String,
  },

  primaryKey: {
    type: String,
    unique: true,
  },

  // ✅ Add this field for salary
  salary: {
    type: Number,
    default: 0, // optional, starts at 0
  },
});

module.exports = mongoose.model("deliveryman", deliverymanSchema);
