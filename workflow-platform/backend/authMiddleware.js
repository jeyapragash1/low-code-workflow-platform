// backend/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-a-env-file'; // Use a strong, random secret!

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // Unauthorized if no token
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden if token is invalid
    }
    req.user = user; // Add the user payload from the token to the request object
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = authenticateToken;