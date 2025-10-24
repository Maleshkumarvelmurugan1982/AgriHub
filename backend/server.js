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
// CORS: allow only your frontend
const allowedOrigins = ["https://agrihub-3.onrender.com"];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // allow server-to-server or Postman requests
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- SESSION --------------------
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // true in production (HTTPS)
    httpOnly: true,
    sameSite: "none", // allows cross-site cookies
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// -------------------- UPLOADS --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if(mimetype && extname) return cb(null, true);
  cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// -------------------- MONGODB --------------------
const MONGO_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/sivajothi";
mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// -------------------- ROUTES --------------------
// Import your routers
const farmerRouter = require("./routes/farmers");
const sellerRouter = require("./routes/sellers");
// ... (add all other routers here)
app.use("/farmer", farmerRouter);
app.use("/seller", sellerRouter);
// ... (rest of your routers)

// Example product route with image upload
const Product = require("./model/Product");

app.post("/product/add", upload.single("productImage"), async (req, res) => {
  try {
    const { productName, category, quantity, price } = req.body;
    let productImage = req.file ? `/uploads/${req.file.filename}` : "";
    const newProduct = new Product({
      productName,
      category,
      quantity: Number(quantity),
      price: Number(price),
      productImage
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.json({ message: "Server is running", status: "OK" });
});

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {
  if(err instanceof multer.MulterError) {
    if(err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File size is too large. Max 5MB" });
    return res.status(400).json({ error: err.message });
  }
  if(err) return res.status(500).json({ error: err.message });
  next();
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

