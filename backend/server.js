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

// -------------------- CORS CONFIGURATION --------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://agrihub-2.onrender.com",
  "https://agrihub-3.onrender.com",
  // Add your production frontend URL here
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, mobile apps, or server-to-server requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️  Blocked by CORS: ${origin}`);
        callback(new Error("CORS policy does not allow access from this origin"), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // Cache preflight request for 10 minutes
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

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
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

// Serve static uploads
app.use("/uploads", express.static(uploadsDir));

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
const uploadRoute = require("./routes/uploadRoute");
const maleshRoutes = require("./routes/malesh");
const prakashRouter = require("./routes/prakash");

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
app.use("/api", uploadRoute); // Cloudinary upload route
app.use("/sellerorder", maleshRoutes);
app.use("/prakash", prakashRouter);

// -------------------- PRODUCT ENDPOINTS --------------------
const Product = require("./model/Product");

// Multer configuration for local uploads (fallback)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(file.mimetype) && 
                  allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (isValid) return cb(null, true);
  cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Add new product (with local upload)
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
    console.error("Error adding product:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all products
app.get("/product", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get product by name
app.get("/product/name/:productName", async (req, res) => {
  try {
    const product = await Product.findOne({ productName: req.params.productName });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 Server is running successfully!", 
    status: "OK",
    environment: process.env.NODE_ENV || "development",
    uploadsPath: "/uploads",
    timestamp: new Date().toISOString(),
    corsEnabled: true,
    allowedOrigins: allowedOrigins
  });
});

// API info endpoint
app.get("/api/info", (req, res) => {
  res.json({
    server: "AgriHub Backend API",
    version: "1.0.0",
    endpoints: {
      products: "/product",
      farmers: "/farmer",
      sellers: "/seller",
      deliverymen: "/deliveryman",
      orders: "/sellerorder, /farmerorder",
      wallet: "/wallet",
      schemes: "/schemes",
      upload: "/api/upload"
    },
    documentation: "Available endpoints listed above"
  });
});

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size is too large. Max limit is 5MB" });
    }
    return res.status(400).json({ error: err.message });
  } else if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "CORS policy violation", message: err.message });
  } else if (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
  next();
});

// 404 handler - This should be LAST
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Route not found", 
    path: req.url,
    method: req.method,
    availableEndpoints: "/api/info"
  });
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🖼️  Static files served at: http://localhost:${PORT}/uploads`);
  console.log(`🌐 CORS enabled for origins:`, allowedOrigins.join(", "));
  console.log(`📋 API Info: http://localhost:${PORT}/api/info`);
  console.log(`${"=".repeat(60)}\n`);
  
  console.log("📋 Key routes registered:");
  console.log(`   - POST   /api/upload (Cloudinary) ✅`);
  console.log(`   - POST   /product/add (Local)`);
  console.log(`   - GET    /product`);
  console.log(`   - GET    /product/name/:productName`);
  console.log(`   - POST   /sellerorder/add`);
  console.log(`   - GET    /sellerorder/farmer/:farmerId`);
  console.log(`   - POST   /farmer/register`);
  console.log(`   - POST   /seller/register`);
  console.log(`   - POST   /deliveryman/register`);
  console.log(`   - GET    /schemes`);
  console.log(`   - GET    /wallet/:userId`);
  console.log(`\n✅ Server ready to accept requests!\n`);
});

