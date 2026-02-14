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

// Middleware - Allow multiple origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  process.env.CLIENT_URL,
  process.env.VERCEL_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches wildcard patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Exact match
      if (origin === allowedOrigin) return true;
      // Wildcard match for Vercel preview deployments
      if (allowedOrigin && allowedOrigin.includes('vercel.app') && origin.includes('vercel.app')) return true;
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
