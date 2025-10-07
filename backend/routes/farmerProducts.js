// ==================== FARMERPRODUCTS.JS ====================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Product = require("../model/Product");

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Add new product (Farmer)
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { farmerId, name, category, description, price, quantity } = req.body;

    // ✅ FIX: Build proper path with forward slashes
    let imagePath = "";
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const newProduct = new Product({
      farmerId,
      name,
      category,
      description,
      price,
      quantity,
      image: imagePath,
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Get all products for a farmer
router.get("/:farmerId", async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.params.farmerId });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Order a product (example: decrease quantity)
router.post("/order/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.quantity < quantity)
      return res.status(400).json({ error: "Not enough stock" });

    product.quantity -= quantity;
    await product.save();

    res.json({ message: "Order successful", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

module.exports = router;