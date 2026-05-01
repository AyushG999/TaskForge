const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

// route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// connect to database
connectDB();

// security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// cors config — restrict in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || true  // same origin in production
    : 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

// rate limiting for auth routes — prevents brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts per 15 minutes
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// general API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

// apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api', apiLimiter);

// api routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // any route that's not an api route -> serve react app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
