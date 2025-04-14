const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const authMiddleware = require('../../middleware/auth');
const apiLimiter = require('../../middleware/apiLimiter');

// Public Routes
router.post('/register', apiLimiter.authLimiter, authController.register);
router.post('/login', apiLimiter.authLimiter, authController.login);
router.post('/forgot-password', apiLimiter.authLimiter, authController.forgotPassword);
router.post('/reset-password', apiLimiter.authLimiter, authController.resetPassword);

// Protected Routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

// Token Management
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
