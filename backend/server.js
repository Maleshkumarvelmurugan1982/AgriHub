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

// -------------------- CORS --------------------
const allowedOrigins = ["https://agrihub-3.onrender.com"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman or server-to-server
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error("CORS policy does not allow access from this origin"),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

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
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// -------------------- UPLOADS --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(file.mimetype) && allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (isValid) return cb(null, true);
  cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// -------------------- MONGODB --------------------
const MONGO_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/sivajothi";
mongoose
  .connect(MONGO_URL)
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
const appliedSchemesRoutes = require("./routes/appliedSchemes");
const sellerOrderRoutes = require("./routes/sellerOrderRoutes");
const maleshRoutes = require("./routes/malesh"); // adjust path

// -------------------- MOUNT ROUTES --------------------
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
app.use("/appliedschemes", appliedSchemesRoutes);
app.use("/sellerorder", sellerOrderRoutes);
app.use("/sellerorder", maleshRoutes);

// -------------------- PRODUCT ENDPOINTS --------------------
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

app.get("/product", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/product/name/:productName", async (req, res) => {
  try {
    const product = await Product.findOne({ productName: req.params.productName });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/product/category/:category", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/product/:id", upload.single("productImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, category, quantity, price } = req.body;
    const updateData = { productName, category, quantity: Number(quantity), price: Number(price) };
    if (req.file) updateData.productImage = `/uploads/${req.file.filename}`;
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    if (deletedProduct.productImage) {
      const imagePath = path.join(__dirname, deletedProduct.productImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    res.json({ message: "Product deleted", deletedProduct });
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
    timestamp: new Date().toISOString(),
  });
});

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "Max file size is 5MB" });
    return res.status(400).json({ error: err.message });
  } else if (err) return res.status(500).json({ error: err.message });
  next();
});

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Uploads served at http://localhost:${PORT}/uploads`);
});
