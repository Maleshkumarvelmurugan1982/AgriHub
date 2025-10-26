const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    category: { 
      type: String, 
      required: true, 
      trim: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    productImage: { 
      type: String, 
      default: "" 
    },
    
    // ✅ CRITICAL: Track which farmer created this product
    farmerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Farmer",
      required: true  // Make this required so every product has a farmer
    }
  },
  { 
    timestamps: true  // Automatically adds createdAt and updatedAt fields
  }
);

// ✅ Add indexes for faster queries
productSchema.index({ farmerId: 1 }); // Index for filtering by farmer
productSchema.index({ category: 1 }); // Index for filtering by category
productSchema.index({ productName: 1 }); // Index for searching by name
productSchema.index({ farmerId: 1, category: 1 }); // Compound index for farmer + category queries

// ✅ Add a virtual field to get farmer details (optional)
productSchema.virtual('farmer', {
  ref: 'Farmer',
  localField: 'farmerId',
  foreignField: '_id',
  justOne: true
});

// ✅ Ensure virtuals are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Product", productSchema)