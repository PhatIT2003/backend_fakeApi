// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const {
  v4: uuidv4
} = require('uuid');
const authMiddleware = require('../middleware/auth.middleware');
module.exports = db => {
  // Get all members
  router.get('/', authMiddleware, (req, res) => {
    const members = db.get('member').value();
    res.status(200).json(members);
  });

  // Create new member
  router.post('/', authMiddleware, (req, res) => {
    const newMember = {
      ...req.body,
      id: uuidv4()
    };
    const members = db.get('member').value() || [];
    members.push(newMember);
    db.set('member', members).write();
    res.status(201).json(newMember);
  });

  // Delete member
  router.delete('/:id', authMiddleware, (req, res) => {
    const {
      id
    } = req.params;
    const members = db.get('member').value() || [];
    const memberIndex = members.findIndex(member => member.id === id);
    if (memberIndex === -1) {
      return res.status(404).json({
        message: 'Member not found'
      });
    }
    members.splice(memberIndex, 1);
    db.set('member', members).write();
    res.status(200).json({
      message: 'Member deleted successfully'
    });
  });

  // Update member
  router.put('/:id', authMiddleware, (req, res) => {
    const {
      id
    } = req.params;
    const members = db.get('member').value() || [];
    const memberIndex = members.findIndex(member => member.id === id);
    if (memberIndex === -1) {
      return res.status(404).json({
        message: 'Member not found'
      });
    }
    const updatedMember = {
      ...members[memberIndex],
      ...req.body
    };
    members[memberIndex] = updatedMember;
    db.set('member', members).write();
    res.status(200).json(updatedMember);
  });
  return router;
};