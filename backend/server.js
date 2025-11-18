const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const gameRoutes = require('./routes/game');


const faucetRoutes = require('./routes/faucet');

const GameManager = require('./services/game/GameManager');
const SocketManager = require('./services/core/SocketManager');
const AptosService = require('./services/aptos/AptosService');

const app = express();
const server = http.createServer(app);

// Enhanced CORS configuration for network access
const allowedOrigins = [
  'https://aptos.pepasur.xyz',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-ID'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Explicit preflight OPTIONS handler for all routes
app.options('*', cors(corsOptions));

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Initialize services
const aptosService = new AptosService(); // Initialize AptosService first
const gameManager = new GameManager(null, aptosService); // Pass aptosService to GameManager
const socketManager = new SocketManager(io, gameManager);

// Set the socketManager reference in gameManager
gameManager.socketManager = socketManager;

// Routes
app.use('/api/game', gameRoutes(gameManager, aptosService));


app.use('/api/faucet', faucetRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    origin: req.get('Origin')
  });
});

// Socket.IO connection handling with enhanced logging
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id} from ${socket.handshake.address}`);

  socket.on('join_game', (data) => {
    console.log(`🎮 Join game request from ${socket.id}:`, data);
    socketManager.handleJoinGame(socket, data);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
    socketManager.handleDisconnect(socket);
  });

  // Game action handlers
  socket.on('submit_action', (data) => {
    console.log(`⚡ Action submitted by ${socket.id}:`, data);
    socketManager.handleSubmitAction(socket, data);
  });

  socket.on('submit_task', (data) => {
    console.log(`📝 Task submitted by ${socket.id}:`, data);
    socketManager.handleSubmitTask(socket, data);
  });

  socket.on('submit_vote', (data) => {
    console.log(`🗳️ Vote submitted by ${socket.id}:`, data);
    socketManager.handleSubmitVote(socket, data);
  });

  socket.on('chat_message', (data) => {
    console.log(`💬 Chat message from ${socket.id}:`, data);
    socketManager.handleChatMessage(socket, data);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

// Connect to MongoDB
connectDB();

server.listen(PORT, HOST, () => {
  console.log(`🚀 ASUR Backend server running on ${HOST}:${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);

  console.log(`🌐 CORS enabled for origins:`, corsOptions.origin);
});

module.exports = { app, server, io };
