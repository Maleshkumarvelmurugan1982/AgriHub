
const router = require("express").Router();
const session = require("express-session");

// Get current logged-in user
router.get("/", (req, res) => {
  if (req.session && req.session.userEmail) {
    res.json({ 
      email: req.session.userEmail,
      authenticated: true
    });
  } else {
    res.status(401).json({ 
      authenticated: false,
      message: "Not logged in" 
    });
  }
});

// Set user session (call this after successful login)
router.post("/set", (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      status: "error",
      message: "Email is required" 
    });
  }
  
  req.session.userEmail = email;
  
  res.json({ 
    status: "success",
    message: "User session created",
    email: email
  });
});

// Clear user session (logout)
router.post("/clear", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        status: "error",
        message: "Failed to clear session" 
      });
    }
    res.json({ 
      status: "success", 
      message: "Session cleared successfully" 
    });
  });
});

module.exports = router