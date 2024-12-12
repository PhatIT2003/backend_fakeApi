const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');  // Sử dụng db.json làm cơ sở dữ liệu giả
const middlewares = jsonServer.defaults();
const { SERVER_PORT, DELAY_TIMEOUT } = require('./config/config');

// Import middlewares
const corsMiddleware = require('./middleware/cors.middleware'); 

// Import routes
const adminRoutes = require('./routesAdmin/admin.routes');
const taskRoutes = require('./routesAdmin/task.routes');
const memberRoutes = require('./routesAdmin/member.routes');
const collectionTaskRoutes = require('./routesAdmin/CollectionTask.routes');
const inviteRoutes = require('./routesAdmin/Invite.routes');
const telegramRoutes = require('./routesTelegram/telegram.routes');
const memberTelegramRoutes = require('./routesTelegram/member.routes');
const taskTelegramRoutes = require('./routesTelegram/task.routes');
const taskDailyRoutes = require('./routesTelegram/taskDaily.routes');
const addressRoutes = require('./routesTelegram/address.routes');
// Middleware
server.use(jsonServer.bodyParser);
server.use(corsMiddleware);
server.use(middlewares);

// Delay middleware
server.use((req, res, next) => { 
    setTimeout(next, DELAY_TIMEOUT);
});

// Logging middleware
server.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
server.use('/admin', adminRoutes(router.db));
server.use('/admin/tasks', taskRoutes(router.db));
server.use('/admin/members', memberRoutes(router.db));
server.use('/admin/collectionTask', collectionTaskRoutes(router.db));
server.use('/admin/invite', inviteRoutes(router.db));
server.use('/telegram/auth', telegramRoutes(router.db));  // Thêm route Telegram
server.use('/telegram/auth/api/users', memberTelegramRoutes(router.db));  // Thêm route Telegram
server.use('/telegram/auth/api/task', taskTelegramRoutes(router.db));  // Thêm route Telegram
server.use('/telegram/auth/api/taskDaily', taskDailyRoutes(router.db));
server.use('/telegram/auth/api/users/address', addressRoutes(router.db));  // Thêm route Telegram

// Default router
server.use(router);

// Start server
server.listen(SERVER_PORT, () => {
    console.log('JSON Server is running on port:', SERVER_PORT);
});
