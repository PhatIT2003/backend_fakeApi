const authMiddleware = require('../middleware/auth.middleware');
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/', authMiddleware, (req, res) => {
        try {
            const members = db.get('member').value() || [];

            // Chỉ lấy các thông tin cần thiết để trả về
            const sanitizedMembers = members.map(member => ({
                id: String(member.id),
                user_id: member.user_id,
                first_name: member.first_name,
                last_name: member.last_name,
                username: member.username,
                token: Number(member.token),
                inviter: String(member.inviter),
                photoUrl: member.photoUrl,
                updatedAt: member.updatedAt,
                languageCode: member.languageCode,
                allowsWriteToPm: member.allowsWriteToPm,
            }));

            res.json({
                success: true,
                count: sanitizedMembers.length,
                members: sanitizedMembers
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thành viên:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi khi truy xuất danh sách thành viên'
            });
        }
    });

    router.get('/invite', authMiddleware, (req, res) => {
        try {
            // Lấy user_id từ thông tin người dùng (giả sử middleware đã gắn thông tin vào req.user)
            const { user_id } = req.user;

            // Lấy danh sách thành viên từ database
            const members = db.get('member').value() || [];

            // Lọc các thành viên có inviter khớp với user_id
            const invitedMembers = members.filter(member => member.inviter === user_id);

            // Chỉ lấy các thông tin cần thiết để trả về
            const sanitizedMembers = invitedMembers.map(member => ({
                id: member.id,
                user_id: member.user_id,
                first_name: member.first_name,
                last_name: member.last_name,
                token: Number(member.token),
                inviter: String(member.inviter),
                photoUrl: member.photoUrl,
            }));

            res.json({
                success: true,
                count: sanitizedMembers.length,
                members: sanitizedMembers
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thành viên mời:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi khi truy xuất danh sách thành viên mời'
            });
        }
    });

    return router;
};
