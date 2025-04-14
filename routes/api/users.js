const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const authMiddleware = require('../../middleware/auth');
const apiLimiter = require('../../middleware/apiLimiter');

// Admin only routes
router.get('/', [authMiddleware, userController.adminCheck], userController.getAllUsers);
router.get('/:id', [authMiddleware, userController.adminCheck], userController.getUserById);

// User management routes (protected)
router.post('/add-credits', authMiddleware, userController.addCredits);
router.get('/credits', authMiddleware, userController.getUserCredits);
router.get('/usage-stats', authMiddleware, userController.getUserUsageStats);

// User specific routes
router.put('/update', authMiddleware, userController.updateUser);
router.delete('/delete', authMiddleware, userController.deleteUser);

module.exports = router;
