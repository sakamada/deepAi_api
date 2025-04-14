require('dotenv').config();
console.log('[INIT] Starting server.js');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
console.log('[INIT] Before DB connection');
connectDB()
  .then(() => {
    // Routes
    try {
      const routes = require('./routes');
      app.use('/api', routes);
      logger.info('Routes loaded successfully');
    } catch (error) {
      logger.error('Error loading routes:', error);
      process.exit(1);
    }
    
    // Error handling middleware
    app.use(errorHandler);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Failed to connect to the database, server not started', err);
    process.exit(1);
  });

// Global error handler for unhandled exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});
