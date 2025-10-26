// server.js
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

// ✅ Serve local uploads (legacy support)
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

// -------------------- IMPORT ROUTERS --------------------
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
const salaryRoutes = require('./routes/salary');
const walletRoutes = require('./routes/walletRoutes');
const orderRoutes = require('./routes/orderRoutes');
const walletRouter = require("./routes/wallet");
const uploadRoute = require("./routes/uploadRoute"); // ✅ <-- Added Cloudinary upload route

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
app.use('/', walletRoutes);
app.use('/sellerorder', orderRoutes);
app.use("/wallet", walletRouter);
app.use("/transactions", walletRouter);
app.use("/deliverypost", deliveryPostRouter);
app.use("/schemes", schemesRouter);
app.use("/appliedschemes", appliedSchemesRoutes);
app.use("/api", uploadRoute); // ✅ <-- New route for uploading images

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
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size is too large. Max limit is 5MB" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message });
  }
  next();
});

// 404 handler - This should be LAST
app.use((req, res) => {
  console.log("❌ 404 - Route not found:", req.method, req.url);
  res.status(404).json({ error: "Route not found", path: req.url });
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🖼️  Static files served at: http://localhost:${PORT}/uploads`);
  console.log(`\n📋 Available routes:`);
  console.log(`   - POST   /api/upload (Cloudinary) ✅`);
  console.log(`   - POST   /product/add`);
  console.log(`   - GET    /product/farmer/:farmerId/category/:category`);
  console.log(`   - GET    /product/farmer/:farmerId`);
  console.log(`   - GET    /product/name/:productName`);
  console.log(`   - GET    /product/category/:category`);
  console.log(`   - POST   /sellerorder/add`);
  console.log(`   - GET    /sellerorder/farmer/:farmerId`);
});
