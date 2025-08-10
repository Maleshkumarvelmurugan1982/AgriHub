const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session"); // for session management
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8070;

// Import User model and auth middleware
const User = require("./model/User");
const authenticate = require("./routes/auth");

// ✅ Middleware to handle CORS properly for frontend (React)
app.use(cors({
  origin: "http://localhost:3000", // frontend origin
  credentials: true,               // allow cookies/auth headers
}));

// Express session config (adjust secret and options as needed)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true } // set secure: true if HTTPS
}));

app.use(express.json());

// ✅ MongoDB Connection
const URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/sivajothi";
mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("✅ MongoDB connection success!");
});

// ✅ Routers
const productRouter = require("./routes/products");
app.use("/product", productRouter);

const farmerRouter = require("./routes/farmers");
app.use("/farmer", farmerRouter);

const sellerRouter = require("./routes/sellers");
app.use("/seller", sellerRouter);

const sellerOrderRouter = require("./routes/sellerOrders");
app.use("/sellerorder", sellerOrderRouter);

const farmerOrderRouter = require("./routes/farmerOrders");
app.use("/farmerorder", farmerOrderRouter);

const deliveryPostRouter = require("./routes/deliveryposts");
app.use("/deliverypost", deliveryPostRouter);

const deliverymanRouter = require("./routes/deliveryman");
app.use("/deliveryman", deliverymanRouter);

const schemesRouter = require("./routes/schemes");
app.use("/schemes", schemesRouter);

const userRouter = require("./routes/user");
app.use("/user", userRouter);

const deliverymenRouter = require("./routes/DeliveryMen");
app.use("/deliverymen", deliverymenRouter);
console.log("Deliverymen router mounted");




// ✅ New route to get current user role
app.get("/api/current-user-role", authenticate, (req, res) => {
  res.json({ role: req.user.role });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
});