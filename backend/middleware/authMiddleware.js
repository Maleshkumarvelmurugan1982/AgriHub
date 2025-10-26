const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    console.log("=== Auth Middleware ===");
    console.log("Cookies received:", req.cookies);
    console.log("Authorization header:", req.headers.authorization);

    // Check for token in cookies or Authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("No token found in cookies or headers");
      return res.status(401).json({ 
        message: "Unauthorized. No token found.",
        error: "UNAUTHORIZED" 
      });
    }

    console.log("Token found:", token.substring(0, 20) + "...");

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("Token decoded successfully:", decoded);

    // Attach user info to request
    req.user = decoded;
    req.userId = decoded.id || decoded.userId || decoded._id;

    console.log("User ID extracted:", req.userId);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token expired. Please log in again.",
        error: "TOKEN_EXPIRED" 
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        message: "Invalid token. Please log in again.",
        error: "INVALID_TOKEN" 
      });
    }

    return res.status(401).json({ 
      message: "Authentication failed.",
      error: error.message 
    });
  }
};

module.exports = authMiddleware;