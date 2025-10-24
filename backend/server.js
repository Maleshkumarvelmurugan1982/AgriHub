// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const deliverymenAuthRouter = require("./routes/deliverymenAuth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8070;

// -------------------- MIDDLEWARE --------------------
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  })
);

// ✅ IMPORTANT: Serve uploaded images as static files
// This must come before other routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

// -------------------- MONGODB CONNECTION --------------------
const MONGO_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/sivajothi";

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------- MULTER SETUP --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Keep original extension (.jpg, .png, .webp etc)
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  },
});

// ✅ Add file filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// -------------------- ROUTERS --------------------
const farmerRouter = require("./routes/farmers");
const sellerRouter = require("./routes/sellers");
const deliverymanRouter = require("./routes/deliveryman");
const productRouter = require("./routes/products");
const farmerProductRouter = require("./routes/farmerProducts");
const sellerOrderRouter = require("./routes/sellerOrders");
const farmerOrderRouter = require("./routes/farmerOrders");
const deliveryPostRouter = require("./routes/deliveryposts");
const schemesRouter = require("./routes/schemes");
const userRouter = require("./routes/user");
const deliverymenRouter = require("./routes/DeliveryMen");
const authRouter = require("./routes/auth");
const appliedSchemesRoutes = require("./routes/appliedSchemes");
const sellerOrderRoutes = require("./routes/sellerOrderRoutes");
const maleshRoutes = require('./routes/malesh'); // Adjust path as needed
app.use('/sellerorder', maleshRoutes);
app.use("/sellerorder", sellerOrderRoutes);


app.use("/appliedschemes", appliedSchemesRoutes);
app.use("/sellerorder", require("./routes/sellerOrders"));
app.use("/products", require("./routes/products"));

app.use("/farmer", farmerRouter);
app.use("/seller", sellerRouter);
app.use("/deliveryman", deliverymanRouter);
app.use("/product", productRouter);
app.use("/farmerProducts", farmerProductRouter);
app.use("/farmerorder", farmerOrderRouter);
app.use("/deliverypost", deliveryPostRouter);
app.use("/schemes", schemesRouter);
app.use("/user", userRouter);
app.use("/deliverymen", deliverymenRouter);
app.use("/auth", authRouter);
app.use("/deliverymenAuth", deliverymenAuthRouter);

// -------------------- PRODUCT ROUTES --------------------
const Product = require("./model/Product");

// ✅ Get product by name
app.get("/product/name/:productName", async (req, res) => {
  try {
    const productName = req.params.productName;
    const product = await Product.findOne({ productName: productName });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add new product with image upload
app.post("/product/add", upload.single("productImage"), async (req, res) => {
  try {
    const { productName, category, quantity, price } = req.body;

    // ✅ Build DB path with forward slashes only
    let productImage = "";
    if (req.file && req.file.filename) {
      productImage = `/uploads/${req.file.filename}`;
    }

    const newProduct = new Product({
      productName,
      category,
      quantity: Number(quantity),
      price: Number(price),
      productImage,
    });

    const savedProduct = await newProduct.save();
    console.log("✅ Product added with image:", productImage);
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all products
app.get("/product", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get products by category
app.get("/product/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update product quantity and price
app.patch("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { quantity: Number(quantity), price: Number(price) },
      { new: true }
    );

    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update product with image
app.put("/product/:id", upload.single("productImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, category, quantity, price } = req.body;

    const updateData = {
      productName,
      category,
      quantity: Number(quantity),
      price: Number(price),
    };

    // If new image is uploaded, update the image path
    if (req.file && req.file.filename) {
      updateData.productImage = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete product
app.delete("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Optional: Delete the image file from uploads folder
    if (deletedProduct.productImage) {
      const imagePath = path.join(__dirname, deletedProduct.productImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("✅ Deleted image file:", imagePath);
      }
    }

    res.json({ message: "Product deleted successfully", deletedProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.json({ 
    message: "Server is running", 
    status: "OK",
    uploadsPath: "/uploads",
    timestamp: new Date().toISOString()
  });
});

// -------------------- ERROR HANDLING --------------------
// Handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size is too large. Max limit is 5MB" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🖼️  Static files served at: http://localhost:${PORT}/uploads`);
});