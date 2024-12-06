// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth.middleware');

module.exports = (db) => {
    // Get all tasks for a specific user
    router.get('/:userId', authMiddleware, (req, res) => {
        const { userId } = req.params;
        const userTasks = db.get('CollectionTask').find({ userId }).value();
        res.status(200).json(userTasks ? userTasks.task : []);
    });

    // Create new task for a specific user
    router.post('/:userId', authMiddleware, (req, res) => {
        const { userId } = req.params;
        const newTask = { ...req.body, id: uuidv4() };
        const userTasks = db.get('CollectionTask').find({ userId });

        if (userTasks.value()) {
            userTasks.get('task').push(newTask).write();
        } else {
            db.get('CollectionTask').push({ userId, task: [newTask] }).write();
        }

        res.status(201).json(newTask);
    });

    // Delete task for a specific user
    router.delete('/:userId/:taskId', authMiddleware, (req, res) => {
        const { userId, taskId } = req.params;
        const userTasks = db.get('CollectionTask').find({ userId });
        
        if (!userTasks.value()) {
            return res.status(404).json({ message: 'User not found' });
        }

        const tasks = userTasks.get('task').value();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Task not found' });
        }

        tasks.splice(taskIndex, 1);
        userTasks.write();
        res.status(200).json({ message: 'Task deleted successfully' });
    });

    // Update task for a specific user
    router.put('/:userId/:taskId', authMiddleware, (req, res) => {
        const { userId, taskId } = req.params;
        const userTasks = db.get('CollectionTask').find({ userId });
        
        if (!userTasks.value()) {
            return res.status(404).json({ message: 'User not found' });
        }

        const tasks = userTasks.get('task').value();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const updatedTask = { ...tasks[taskIndex], ...req.body };
        tasks[taskIndex] = updatedTask;
        userTasks.write();
        res.status(200).json(updatedTask);
    });

    return router;
};