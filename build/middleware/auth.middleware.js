// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const {
  JWT_SECRET
} = require('../config/config');
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized'
    });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    req.user = decoded;
    next();
  });
};
module.exports = authMiddleware;