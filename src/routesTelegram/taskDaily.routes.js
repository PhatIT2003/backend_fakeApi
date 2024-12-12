const authMiddleware = require('../middleware/auth.middleware');
const express = require('express');
const router = express.Router();

module.exports = (db) => {

    router.get('/', authMiddleware, (req, res) => {
        try {
            const tasks = db.get('taskDaily').value() || [];
         
            // Thêm thông tin về trạng thái hoàn thành
            const sanitizedTasks = tasks.map(task => ({
                id: task.id,
                stt: task.stt,
                name_task: task.name_task,
                link_task: task.link_task,
                token: task.token,
                isCompleted: task.isCompleted || false,
                completedAt: task.completedAt || null
            }));
    
            res.json({
                success: true,
                count: sanitizedTasks.length,
                tasks: sanitizedTasks
            }); 
        } catch (error) {
            console.error('Error retrieving task list:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving task list'
            });
        }
    });
    router.post('/completeDaily/:taskId', authMiddleware, (req, res) => {
        try {
            const taskId = req.params.taskId;
            const userId = req.user.id;
        
            // Kiểm tra nhiệm vụ
            const task = db.get('taskDaily').find({ id: taskId }).value();
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
        
            // Kiểm tra xem người dùng đã hoàn thành nhiệm vụ này chưa
            const existingUserCollection = db.get('CollectionTaskDaily')
                .find({ userId: userId.toString() })
                .value();
        
            // Kiểm tra xem task đã tồn tại trong collection của user chưa
            const isTaskAlreadyCompleted = existingUserCollection && 
                existingUserCollection.task.some(t => t.id === taskId);
        
            if (isTaskAlreadyCompleted) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Task already completed by this user' 
                });
            }
            // Tìm user để cộng token
            const user = db.get('member').find({ user_id: userId }).value();
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }
        
            // Cộng token cho user
            const taskToken = Number(task.token) || 0;
            db.get('member')
                .find({ user_id: userId })
                .update('token', currentToken => (Number(currentToken) || 0) + taskToken)
                .write();

            // Tạo hoặc cập nhật CollectionTask cho người dùng
            if (existingUserCollection) {
                // Nếu người dùng đã có collection, thêm nhiệm vụ mới
                db.get('CollectionTaskDaily')
                    .find({ userId: userId.toString() })
                    .get('task')
                    .push({
                        ...task,
                        isCompleted: true,
                        completedAt: new Date(),
                        completedBy: userId
                    })
                    .write();
            } else {
                // Nếu chưa có collection, tạo mới
                db.get('CollectionTaskDaily')
                    .push({
                        userId: userId.toString(),
                        task: [{
                            ...task,
                            isCompleted: true,
                            completedAt: new Date(),
                            completedBy: userId
                        }]
                    })
                    .write();
            }
        
            res.json({
                success: true,
                message: 'Task marked as completed',
                tokenEarned: taskToken
            });
        } catch (error) {
            console.error('Error marking task as complete:', error);
            res.status(500).json({
                success: false,
                message: 'Error marking task as complete'
            });
        }
  
    });
    router.get('/completedDaily-tasks', authMiddleware, (req, res) => {
        try {
            const userId = req.user.id;
            const userCollection = db.get('CollectionTaskDaily')
                .find({ userId: userId.toString() })
                .value();
    
            const completedTasks = userCollection ? userCollection.task.filter(t => t.isCompleted) : [];
    
            res.json({
                success: true,
                count: completedTasks.length,
                tasks: completedTasks
            });
        } catch (error) {
            console.error('Error retrieving completed tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving completed tasks'
            });
        }
    });
    return router;
};