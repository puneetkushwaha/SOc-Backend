require("dotenv").config();
const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config/config');
const connectDB = require('./config/db');

const { errorHandler } = require('./utils/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');
const incidentsRouter = require('./routes/incidents');
const metricsRouter = require('./routes/metrics');
const playbooksRouter = require('./routes/playbooks');
const integrationsRouter = require('./routes/integrations');
const alertsRouter = require('./routes/alerts');
const webhooksRouter = require('./routes/webhooks');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

app.use(generalLimiter);
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.options("*", cors());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Cyber Vigilance System (CVS) API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/auth'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/playbooks', playbooksRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/webhooks', webhooksRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
  
  socket.on('subscribe', (room) => {
    socket.join(room);
    console.log(`📡 Socket ${socket.id} joined room: ${room}`);
  });

  // Handle client heartbeat
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Make io accessible globally for services
global.io = io;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`📡 Socket.IO ready for connections`);
      console.log(`\n🔐 Authentication endpoints:`);
      console.log(`  POST /api/auth/register - Register new user`);
      console.log(`  POST /api/auth/login - Login user`);
      console.log(`  POST /api/auth/logout - Logout user`);
      console.log(`\n📊 SIEM Integration endpoints:`);
      console.log(`  POST /api/webhooks/splunk - Receive Splunk events`);
      console.log(`  POST /api/webhooks/custom - Receive custom SIEM events`);
      console.log(`  POST /api/webhooks/register - Register new integration`);
      console.log(`  GET  /api/webhooks/integrations - List integrations`);
      console.log(`\n💡 Webhook URL for your applications:`);
      console.log(`  http://localhost:${config.PORT}/api/webhooks/custom`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

startServer();

module.exports = { app, server, io };
