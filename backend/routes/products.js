// backend/routes/products.js
const express = require("express");
const router = express.Router();
const Product = require("../model/Product");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// -------------------- MULTER + CLOUDINARY SETUP --------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "my_project_uploads", // Cloudinary folder name
    format: async (req, file) => {
      const ext = file.mimetype.split("/")[1]; // get actual MIME type
      if (["jpeg", "jpg", "png", "webp"].includes(ext)) return ext;
      throw new Error(`${ext} not allowed`);
    },
  },
});

const upload = multer({ storage });

// -------------------- ROUTES --------------------

// 1️⃣ Get products by farmer and category
router.get("/farmer/:farmerId/category/:category", async (req, res) => {
  try {
    const { farmerId, category } = req.params;
    const products = await Product.find({ farmerId, category }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching farmer products:", err);
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
});

// 2️⃣ Get all products by farmer
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;
    const products = await Product.find({ farmerId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching farmer products:", err);
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
});

// 3️⃣ Get product by name
router.get("/name/:productName", async (req, res) => {
  try {
    const { productName } = req.params;
    const product = await Product.findOne({ productName }).populate("farmerId");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("❌ Error fetching product by name:", err);
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
});

// 4️⃣ Get products by category (all farmers)
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).populate("farmerId").sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products by category:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 5️⃣ POST add new product with Cloudinary image upload
router.post("/add", upload.single("productImage"), async (req, res) => {
  try {
    const { productName, category, quantity, price, farmerId } = req.body;

    if (!productName || !category || !quantity || !price || !farmerId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const productImage = req.file ? req.file.path : "";

    const newProduct = new Product({
      productName,
      category,
      quantity: Number(quantity),
      price: Number(price),
      productImage, // Cloudinary URL
      farmerId,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, product: savedProduct });
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// 6️⃣ PATCH/UPDATE product
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
});

// 7️⃣ DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully", product: deletedProduct });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
});

// 8️⃣ GET single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("farmerId");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
});

// 9️⃣ GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("farmerId").sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching all products:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
