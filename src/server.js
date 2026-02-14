const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const debtsRoutes = require('./routes/debts');
const savingsRoutes = require('./routes/savings');
let devMigrations;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS Configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://frontend-management-uang.vercel.app',
  process.env.CLIENT_URL,
  process.env.VERCEL_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (origin === allowedOrigin) return true;
      // Allow all Vercel preview deployments
      if (origin.endsWith('.vercel.app')) return true;
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Don't throw error, just deny the request
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/savings', savingsRoutes);

// Mount dev migrations only when not in production
if (process.env.NODE_ENV !== 'production') {
  devMigrations = require('./routes/dev_migrations');
  app.use('/api/dev-migrations', devMigrations);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== ERROR ===');
  console.error('Time:', new Date().toISOString());
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('=============');
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
