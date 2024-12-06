const express = require('express');

const authMiddleware = require('../middleware/auth.middleware');

module.exports = (db) => {
    const router = express.Router();

    // Lấy danh sách thành viên mời
    router.get('/:user_id', authMiddleware, (req, res) => {
        try {
            const { user_id } = req.params;
            const members = db.get('member').value() || [];

            const invitedMembers = members.filter(member => member.inviter === user_id);

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

    // Thêm thành viên
    router.post('/:user_id', authMiddleware, (req, res) => {
        try {
            const { user_id } = req.params;
            const { id } = req.body;

            if (!id || !user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID and Member ID are required'
                });
            }

            const member = db.get('member').find({ id }).value();
            if (!member) {
                return res.status(404).json({
                    success: false,
                    error: 'Member not found'
                });
            }

            // Nếu thành viên đã bị xóa (inviter === null), có thể thêm lại
            if (member.inviter === null) {
                db.get('member')
                    .find({ id })
                    .assign({ inviter: user_id }) // Cập nhật lại inviter cho thành viên
                    .write();

                return res.json({
                    success: true,
                    message: 'Member added back successfully',
                    inviter: user_id,
                    memberId: id
                });
            }

            // Nếu thành viên chưa có inviter, tiến hành thêm
            if (!member.inviter) {
                db.get('member')
                    .find({ id })
                    .assign({ inviter: user_id })
                    .write();

                return res.json({
                    success: true,
                    message: 'Member added successfully',
                    inviter: user_id,
                    memberId: id
                });
            }

            return res.status(400).json({
                success: false,
                error: 'Member already belongs to another inviter'
            });

        } catch (error) {
            console.error('Error adding member:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding member'
            });
        }
    });

    // Xóa thành viên
    router.delete('/:user_id', authMiddleware, (req, res) => {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required in the request body'
                });
            }

            const member = db.get('member').find({ id }).value();
            if (!member) {
                return res.status(404).json({
                    success: false,
                    error: 'Member not found'
                });
            }

            // Nếu inviter là null, tức là thành viên đã bị xóa
            if (member.inviter === null) {
                return res.status(400).json({
                    success: false,
                    error: 'This member has already been removed'
                });
            }

            // Cập nhật inviter thành null để xóa
            db.get('member')
                .find({ id })
                .assign({ inviter: null })
                .write();

            res.json({
                success: true,
                message: 'Member removed successfully',
                memberId: id
            });
        } catch (error) {
            console.error('Error removing member:', error);
            res.status(500).json({
                success: false,
                error: 'Error removing member'
            });
        }
    });

    return router;
};
