// middleware/auth.js
const User = require("../model/User");

function authenticate(req, res, next) {
  if (req.session && req.session.userId) {
    User.findById(req.session.userId)
      .then(user => {
        if (user) {
          req.user = user;
          next();
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      })
      .catch(err => res.status(500).json({ message: "Server error" }));
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = authenticate;