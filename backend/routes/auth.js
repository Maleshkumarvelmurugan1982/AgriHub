const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Farmer = require("../models/Farmer");
const Seller = require("../models/Seller");
const Deliveryman = require("../models/Deliveryman");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

const getModelByRole = (role) => {
  switch (role) {
    case "Farmer": return Farmer;
    case "Seller": return Seller;
    case "Deliveryman": return Deliveryman;
    default: return null;
  }
};

// ------------------ REGISTER ------------------
router.post("/register", async (req, res) => {
  try {
    const { email, password, role, fname, lname, district } = req.body;

    if (!email || !password || !role || !fname || !lname || !district) {
      return res.json({ status: "error", message: "All fields are required" });
    }

    const Model = getModelByRole(role);
    if (!Model) return res.json({ status: "error", message: "Invalid role" });

    const existingUser = await Model.findOne({ email });
    if (existingUser) return res.json({ status: "error", message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Model({ email, password: hashedPassword, fname, lname, district });
    await newUser.save();

    return res.json({ status: "ok", message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.json({ status: "error", message: "Server error" });
  }
});

// ------------------ LOGIN ------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.json({ status: "error", message: "All fields are required" });
    }

    const Model = getModelByRole(role);
    if (!Model) return res.json({ status: "error", message: "Invalid role" });

    const user = await Model.findOne({ email });
    if (!user) return res.json({ status: "error", message: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.json({ status: "error", message: "Invalid credentials" });

    const token = jwt.sign({ email: user.email, role, id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      status: "ok",
      data: { token, role, email: user.email, fname: user.fname, lname: user.lname }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
