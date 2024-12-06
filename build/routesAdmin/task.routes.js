// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const {
  v4: uuidv4
} = require('uuid');
const authMiddleware = require('../middleware/auth.middleware');
module.exports = db => {
  // Get all tasks
  router.get('/', authMiddleware, (req, res) => {
    const tasks = db.get('task').value();
    res.status(200).json(tasks);
  });

  // Create new task
  router.post('/', authMiddleware, (req, res) => {
    const newTask = {
      ...req.body,
      id: uuidv4()
    };
    const tasks = db.get('task').value() || [];
    tasks.push(newTask);
    db.set('task', tasks).write();
    res.status(201).json(newTask);
  });

  // Delete task
  router.delete('/:id', authMiddleware, (req, res) => {
    const {
      id
    } = req.params;
    const tasks = db.get('task').value() || [];
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }
    tasks.splice(taskIndex, 1);
    db.set('task', tasks).write();
    res.status(200).json({
      message: 'Task deleted successfully'
    });
  });

  // Update task
  router.put('/:id', authMiddleware, (req, res) => {
    const {
      id
    } = req.params;
    const tasks = db.get('task').value() || [];
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }
    const updatedTask = {
      ...tasks[taskIndex],
      ...req.body
    };
    tasks[taskIndex] = updatedTask;
    db.set('task', tasks).write();
    res.status(200).json(updatedTask);
  });
  return router;
};