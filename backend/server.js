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
    origin: [
      "http://localhost:3000",               // local frontend dev
      "https://agri-hub-ghbm.vercel.app",    // Vercel deployed frontend (replace with your real URL)
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
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
    cookie: {
      secure: process.env.NODE_ENV === "production", // only true on Render (https)
      httpOnly: true,
    },
  })
);

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- MONGODB CONNECTION --------------------
const MONGO_URL = process.env.MONGODB_URL; // must be set in Render
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------- MULTER SETUP --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// -------------------- ROUTERS --------------------
const authenticate = require("./routes/auth");
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
const Product = require("./model/Product");

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

app.patch("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { quantity: Number(quantity), price: Number(price) },
      { new: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
