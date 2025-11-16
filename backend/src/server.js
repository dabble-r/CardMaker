require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const cardsRoutes = require('./routes/cards');
const templatesRoutes = require('./routes/templates');
const assetsRoutes = require('./routes/assets');
const exportRoutes = require('./routes/export');
const usersRoutes = require('./routes/users');

// Connect to database (non-blocking, don't wait for it)
setTimeout(() => {
  connectDB().catch(err => {
    console.error('Failed to connect to database:', err.message);
  });
}, 100);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Headers:`, {
    authorization: req.headers.authorization ? 'present' : 'missing',
    origin: req.headers.origin,
    'content-type': req.headers['content-type'],
  });
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/cards', cardsRoutes);
app.use('/templates', templatesRoutes);
app.use('/assets', assetsRoutes);
app.use('/export', exportRoutes);
app.use('/users', usersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Please stop the process using port ${PORT} or change the PORT in .env`);
    console.error(`   To kill the process: npx kill-port ${PORT}`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

