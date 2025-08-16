// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");

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

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- MONGODB CONNECTION --------------------
const MONGO_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/sivajothi";
mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------- MULTER SETUP --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// -------------------- AUTH MIDDLEWARE --------------------
const authenticate = require("./routes/auth");

// -------------------- ROUTERS --------------------
const productRouter = require("./routes/products");
const farmerRouter = require("./routes/farmers");
const farmerProductRouter = require("./routes/farmerProducts");
const sellerRouter = require("./routes/sellers");
const sellerOrderRouter = require("./routes/sellerOrders");
const farmerOrderRouter = require("./routes/farmerOrders");
const deliveryPostRouter = require("./routes/deliveryposts");
const deliverymanRouter = require("./routes/deliveryman");
const schemesRouter = require("./routes/schemes");
const userRouter = require("./routes/user");
const deliverymenRouter = require("./routes/DeliveryMen");
const authRouter = require("./routes/auth");

// Use routers
app.use("/product", productRouter);
app.use("/farmer", farmerRouter);
app.use("/farmerProducts", farmerProductRouter);
app.use("/seller", sellerRouter);
app.use("/sellerorder", sellerOrderRouter);
app.use("/farmerorder", farmerOrderRouter);
app.use("/deliverypost", deliveryPostRouter);
app.use("/deliveryman", deliverymanRouter);
app.use("/schemes", schemesRouter);
app.use("/user", userRouter);
app.use("/deliverymen", deliverymenRouter);
app.use("/auth", authRouter);

// -------------------- CURRENT USER ROLE --------------------
app.get("/api/current-user-role", authenticate, (req, res) => {
  res.json({ role: req.user.role });
});

// -------------------- VEGETABLE PRODUCT ROUTES --------------------
const Product = require("./models/Product");

// Add new vegetable product
app.post("/product/add", upload.single("productImage"), async (req, res) => {
  try {
    const { productName, category, quantity, price } = req.body;

    const productImage = req.file ? `/uploads/${req.file.filename}` : "";

    const newProduct = new Product({
      productName,
      category,
      quantity: Number(quantity),
      price: Number(price),
      productImage,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get products by category (e.g., Veg)
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

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
