const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8070;

// -------------------- CORS CONFIGURATION --------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://agrihub-2.onrender.com",
  "https://agrihub-3.onrender.com",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Accept");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  // Handle preflight requests
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// -------------------- UPLOADS DIRECTORY --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// -------------------- MONGODB CONNECTION --------------------
mongoose
  .connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/sivajothi")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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
const deliverymenAuthRouter = require("./routes/deliverymenAuth");
const appliedSchemesRoutes = require("./routes/appliedSchemes");
const salaryRoutes = require("./routes/salary");
const walletRoutes = require("./routes/walletRoutes");
const orderRoutes = require("./routes/orderRoutes");
const walletRouter = require("./routes/wallet");
const uploadRoute = require("./routes/uploadRoute");
const maleshRoutes = require("./routes/malesh");

// -------------------- REGISTER ROUTES --------------------
app.use('/salary', salaryRoutes);
app.use("/auth", authRouter);
app.use("/deliverymenAuth", deliverymenAuthRouter);
app.use("/farmer", farmerRouter);
app.use("/seller", sellerRouter);
app.use("/deliveryman", deliverymanRouter);
app.use("/user", userRouter);
app.use("/deliverymen", deliverymenRouter);
app.use("/product", productRouter);
app.use("/farmerProducts", farmerProductRouter);
app.use("/sellerorder", sellerOrderRouter);
app.use("/farmerorder", farmerOrderRouter);
app.use("/", walletRoutes);
app.use("/sellerorder", orderRoutes);
app.use("/wallet", walletRouter);
app.use("/transactions", walletRouter);
app.use("/deliverypost", deliveryPostRouter);
app.use("/schemes", schemesRouter);
app.use("/appliedschemes", appliedSchemesRoutes);
app.use("/api", uploadRoute); // Cloudinary upload route
app.use("/sellerorder", maleshRoutes);

// -------------------- MULTER CONFIG --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-")),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(file.mimetype) && allowedTypes.test(path.extname(file.originalname).toLowerCase());
  cb(isValid ? null : new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"), isValid);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// -------------------- PRODUCT ENDPOINTS --------------------
const Product = require("./model/Product");

app.post("/product/add", upload.single("productImage"), async (req, res) => {
  try {
    const { productName, category, quantity, price } = req.body;
    const productImage = req.file ? `/uploads/${req.file.filename}` : "";
    const newProduct = new Product({ productName, category, quantity: Number(quantity), price: Number(price), productImage });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/product", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/product/name/:productName", async (req, res) => {
  try {
    const product = await Product.findOne({ productName: req.params.productName });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.json({ message: "🚀 Server running!", environment: process.env.NODE_ENV || "development", corsEnabled: true, allowedOrigins });
});

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  if (err.message && err.message.includes("CORS")) return res.status(403).json({ error: "CORS policy violation", message: err.message });
  res.status(500).json({ error: err.message || "Internal server error" });
});

// -------------------- 404 HANDLER --------------------
app.use((req, res) => res.status(404).json({ error: "Route not found", path: req.url, method: req.method }));

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for origins:`, allowedOrigins.join(", "));
});
