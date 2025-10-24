const router = require("express").Router();
const Farmer = require("../model/Farmer");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "78rfrbrefhadnbfrf6y9u0jjpm'[khuuv8f93fuqwhisbedfv8w2bdeb";

// ----------------- REGISTER -----------------
router.post(
  "/register",
  [
    body("userRole").notEmpty().withMessage("User role is required"),
    body("fname").notEmpty().withMessage("First name is required"),
    body("lname").notEmpty().withMessage("Last name is required"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email"),
    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("district").notEmpty().withMessage("District is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { userRole, fname, lname, email, password, district } = req.body;

      const encryptedPassword = await bcrypt.hash(password, 10);

      // Check if user already exists by email + role
      const existingFarmer = await Farmer.findOne({ email: email.trim().toLowerCase(), userRole });
      if (existingFarmer) return res.status(400).json({ error: "This Farmer already exists!" });

      const newFarmer = new Farmer({
        userRole,
        fname,
        lname,
        email: email.trim().toLowerCase(),
        district,
        password: encryptedPassword,
      });

      await newFarmer.save();

      res.status(201).json({
        message: "New farmer added successfully!",
        data: {
          userRole: newFarmer.userRole,
          fname: newFarmer.fname,
          lname: newFarmer.lname,
          email: newFarmer.email,
          district: newFarmer.district,
        },
      });
    } catch (error) {
      console.error("Error registering farmer:", error);
      res.status(500).json({ error: "Server error. Failed to register farmer." });
    }
  }
);

// ----------------- LOGIN -----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, userRole } = req.body;

    if (!email || !password || !userRole) {
      return res.status(400).json({ status: "error", error: "Email, password, and role are required" });
    }

    const farmer = await Farmer.findOne({ email: email.trim().toLowerCase() });
    if (!farmer) return res.status(400).json({ status: "error", error: "This user has not been registered!" });

    if (farmer.userRole !== userRole) return res.status(400).json({ status: "error", error: "Incorrect user role" });

    const isPasswordMatch = await bcrypt.compare(password, farmer.password);
    if (!isPasswordMatch) return res.status(401).json({ status: "error", error: "Invalid password" });

    // Generate JWT token
    const token = jwt.sign({ email: farmer.email }, JWT_SECRET);

    // Optional: store in session if needed
    req.session.userId = farmer._id;

    res.status(200).json({ status: "ok", data: token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: "error", error: "An error occurred during login" });
  }
});

module.exports = router;
