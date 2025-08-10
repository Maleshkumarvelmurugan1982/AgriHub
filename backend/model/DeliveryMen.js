const mongoose = require("mongoose");

const deliveryMenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "deliverymen", // explicitly tell mongoose which collection to use
  }
);

const DeliveryMen = mongoose.model("DeliveryMen", deliveryMenSchema);

module.exports = DeliveryMen;
