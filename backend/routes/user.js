const router = require("express").Router();
const jwt = require("jsonwebtoken");

const Deliveryman = require("../model/Deliveryman");
const Farmer = require("../model/Farmer");
const Seller = require("../model/Seller");

const JWT_SECRET = "78rfrbrefhadnbfrf6y9u0jjpm'[khuuv8f93fuqwhisbedfv8w2bdeb";

// POST /user/userdata
router.post("/userdata", async (req, res) => {
  const { token } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET);

    // Try to find user by email in all user collections
    let data =
      (await Deliveryman.findOne({ email: user.email })) ||
      (await Farmer.findOne({ email: user.email })) ||
      (await Seller.findOne({ email: user.email }));

    if (!data) {
      return res.status(404).json({ status: "error", error: "User not found" });
    }

    res.json({ status: "ok", data });
  } catch (error) {
    console.error("Error verifying token or fetching user data:", error);
    res.status(401).json({ status: "error", error: "Invalid or expired token" });
  }
});

module.exports = router;
