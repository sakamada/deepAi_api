const express = require('express');
const router = express.Router();
const accountController = require('../../controllers/accountController');
const authMiddleware = require('../../middleware/auth');

// DeepAI Account Management Routes
router.get('/', authMiddleware, accountController.getAccounts);
router.post('/', authMiddleware, accountController.addAccount);
router.put('/:id', authMiddleware, accountController.updateAccount);
router.delete('/:id', authMiddleware, accountController.deleteAccount);

// Account Statistics and Management
router.get('/:id/stats', authMiddleware, accountController.getAccountStats);
router.post('/:id/switch', authMiddleware, accountController.switchAccount);
router.post('/:id/reset-usage', authMiddleware, accountController.resetAccountUsage);

module.exports = router;