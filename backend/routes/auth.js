const express = require("express");
const User = require("../model/User");
const bcrypt = require("bcryptjs"); // for password hashing

const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ status: "error", message: "Username and password required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.json({ status: "error", message: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.json({ status: "error", message: "Invalid credentials" });

    // Save user ID in session
    req.session.userId = user._id;

    // Return role in response
    res.json({
      status: "ok",
      data: {
        role: user.role,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
