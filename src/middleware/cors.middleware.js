// middleware/cors.middleware.js
const { FRONTEND_URL } = require('../config/config');

const corsMiddleware = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
};

module.exports = corsMiddleware;