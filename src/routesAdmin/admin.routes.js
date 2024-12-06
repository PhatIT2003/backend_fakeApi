// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
module.exports = (db) => {
    // Login route
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        const admin = db.get('Admin').find({ email, password }).value();

        if (admin) {
            const token = jwt.sign({ userId: admin.id }, JWT_SECRET, { expiresIn: '1h' });
            const expiresAt = new Date(Date.now() + 3600000).toISOString();

            res.status(200).json({
                data: {
                    token,
                    expiresAt,
                    account: {
                        id: admin.id,
                        name: admin.name,
                        email: admin.email
                    }
                },
                message: 'Đăng nhập thành công'
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });

    // Logout route
    router.post('/logout', (req, res) => {
        res.status(200).json({ message: 'Đăng xuất thành công' });
    });

    // Get user info route
    router.get('/user', authMiddleware, (req, res) => {
        const admin = db.get('Admin').find({ id: req.user.userId }).value();
        if (admin) {
            res.status(200).json(admin);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });

    return router;
};