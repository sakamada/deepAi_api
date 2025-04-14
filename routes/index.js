const express = require('express');
const path = require('path');
const router = express.Router();

// Import route modules
const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');
const accountRoutes = require('./api/accounts');
const serviceRoutes = require('./api/services');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/services', serviceRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
