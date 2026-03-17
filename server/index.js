require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketService = require('./services/socketService');
const verifyToken = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Socket.IO
socketService.init(server);

// Public routes (no auth)
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes
app.use('/api/ingest', verifyToken, require('./routes/ingestRoutes'));
app.use('/api/devices', verifyToken, require('./routes/deviceRoutes'));
app.use('/api/alerts', verifyToken, require('./routes/alertRoutes'));
app.use('/api/logs', verifyToken, require('./routes/logRoutes'));
app.use('/api/dashboard', verifyToken, require('./routes/dashboardRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date() }, error: null });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[MongoDB] Connected successfully');
    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  });
