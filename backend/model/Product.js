const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    productImage: { type: String, default: "" }, // stores image path
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
