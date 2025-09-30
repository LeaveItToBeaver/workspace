const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./src/config/environment');
const database = require('./src/config/database');
const userRoutes = require('./src/routes/userRoutes');
const errorHandler = require('./src/middleware/errorHandler');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      /\.csb\.app$/,
      /\.codesandbox\.io$/,
    ];

    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (development)
if (config.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

database.initialize()
  .then(() => console.log('Database connected successfully'))
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'User Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
    },
  });
});

app.use('/api/users', userRoutes);

app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Start server
const PORT = config.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

module.exports = app;