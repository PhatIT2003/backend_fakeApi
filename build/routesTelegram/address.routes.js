const authMiddleware = require('../middleware/auth.middleware');
const express = require('express');
const router = express.Router();
module.exports = db => {
  // Define the updateUserAddress method in your db object
  db.updateUserAddress = async (userId, newAddress) => {
    // Implement the logic to update the user's address in the database
    // Example:
    const member = db.get('member').find({
      user_id: userId
    }).value();
    if (member) {
      member.address = newAddress; // Update the address
      db.get('member').find({
        user_id: userId
      }).assign(member).write(); // Save changes
    } else {
      throw new Error('Member not found');
    }
  };
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const {
        id
      } = req.params;
      const members = db.get('member').value() || [];
      const member = members.find(member => member.id === id);

      // Add explicit check for member existence
      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy thành viên'
        });
      }
      const newAddress = req.body.address;

      // Validate address
      if (!newAddress) {
        return res.status(400).json({
          success: false,
          error: 'Địa chỉ không hợp lệ'
        });
      }

      // Check if updateUserAddress is a function
      if (typeof db.updateUserAddress !== 'function') {
        console.error('updateUserAddress is not defined on db');
        return res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống: không thể cập nhật địa chỉ'
        });
      }
      try {
        await db.updateUserAddress(member.user_id, newAddress);
        res.status(200).json({
          success: true,
          message: 'Cập nhật địa chỉ thành công'
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật địa chỉ:', error);
        res.status(500).json({
          success: false,
          error: 'Lỗi khi cập nhật địa chỉ'
        });
      }
    } catch (error) {
      console.error('Lỗi khi xử lý yêu cầu:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi xử lý yêu cầu'
      });
    }
  });
  return router;
};