const DeepAIAccount = require('../models/DeepAIAccount');
const ApiUsage = require('../models/ApiUsage');
const { encrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

// Get all DeepAI accounts
exports.getAccounts = async (req, res) => {
  try {
    // Only show accounts created by the current user
    const accounts = await DeepAIAccount.find({ createdBy: req.user.id })
      .select('-apiKey')
      .sort({ isPrimary: -1, createdAt: -1 });

    return res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    logger.error(`Error getting accounts: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add new DeepAI account
exports.addAccount = async (req, res) => {
  try {
    const { name, email, apiKey, isPrimary, dailyLimit, monthlyLimit } = req.body;

    // Validate input
    if (!name || !email || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and API key are required'
      });
    }

    // Check if account with this email already exists for this user
    const existingAccount = await DeepAIAccount.findOne({
      email,
      createdBy: req.user.id
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Account with this email already exists'
      });
    }

    // Encrypt API key
    const encryptedKey = encrypt(apiKey, process.env.ENCRYPTION_KEY);

    // If this is set as primary, update all other accounts
    if (isPrimary) {
      await DeepAIAccount.updateMany(
        { createdBy: req.user.id },
        { isPrimary: false }
      );
    }

    // Create new account
    const account = await DeepAIAccount.create({
      name,
      email,
      apiKey: encryptedKey,
      isPrimary: isPrimary || false,
      dailyLimit: dailyLimit || 500,
      monthlyLimit: monthlyLimit || 500,
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      data: {
        id: account._id,
        name: account.name,
        email: account.email,
        isPrimary: account.isPrimary,
        dailyLimit: account.dailyLimit,
        monthlyLimit: account.monthlyLimit,
        usageCount: account.usageCount,
        createdAt: account.createdAt
      }
    });
  } catch (error) {
    logger.error(`Error adding account: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update DeepAI account
exports.updateAccount = async (req, res) => {
  try {
    const { name, email, apiKey, isPrimary, dailyLimit, monthlyLimit, isActive } = req.body;

    // Find account and check if it belongs to the user
    const account = await DeepAIAccount.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).select('+apiKey');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Update fields if provided
    if (name) account.name = name;
    if (email) account.email = email;
    
    // Only update API key if provided
    if (apiKey) {
      const encryptedKey = encrypt(apiKey, process.env.ENCRYPTION_KEY);
      account.apiKey = encryptedKey;
    }
    
    // Handle isActive setting
    if (isActive !== undefined) {
      account.isActive = isActive;
    }

    // Handle isPrimary setting - if setting to primary, update other accounts
    if (isPrimary && !account.isPrimary) {
      await DeepAIAccount.updateMany(
        { createdBy: req.user.id, _id: { $ne: account._id } },
        { isPrimary: false }
      );
      account.isPrimary = true;
    } else if (isPrimary !== undefined) {
      account.isPrimary = isPrimary;
    }

    // Update limits if provided
    if (dailyLimit) account.dailyLimit = dailyLimit;
    if (monthlyLimit) account.monthlyLimit = monthlyLimit;

    await account.save();

    return res.json({
      success: true,
      data: {
        id: account._id,
        name: account.name,
        email: account.email,
        isPrimary: account.isPrimary,
        isActive: account.isActive,
        dailyLimit: account.dailyLimit,
        monthlyLimit: account.monthlyLimit,
        usageCount: account.usageCount,
        updatedAt: account.updatedAt
      }
    });
  } catch (error) {
    logger.error(`Error updating account: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete DeepAI account
exports.deleteAccount = async (req, res) => {
  try {
    // Find account and check if it belongs to the user
    const account = await DeepAIAccount.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Check if this is the primary account
    if (account.isPrimary) {
      // Find another account to set as primary
      const otherAccount = await DeepAIAccount.findOne({
        createdBy: req.user.id,
        _id: { $ne: account._id }
      });

      if (otherAccount) {
        otherAccount.isPrimary = true;
        await otherAccount.save();
      }
    }

    await account.remove();

    return res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting account: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get account stats
exports.getAccountStats = async (req, res) => {
  try {
    // Find account and check if it belongs to the user
    const account = await DeepAIAccount.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Get API usage stats for this account
    const usageStats = await ApiUsage.aggregate([
      { $match: { deepAiAccount: account._id } },
      {
        $group: {
          _id: '$endpoint',
          count: { $sum: 1 },
          totalCredits: { $sum: '$creditsUsed' },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    // Get daily usage trends
    const dailyTrends = await ApiUsage.aggregate([
      { $match: { deepAiAccount: account._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalCredits: { $sum: '$creditsUsed' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return res.json({
      success: true,
      data: {
        account: {
          id: account._id,
          name: account.name,
          email: account.email,
          isActive: account.isActive,
          isPrimary: account.isPrimary,
          usageCount: account.usageCount,
          dailyLimit: account.dailyLimit,
          monthlyLimit: account.monthlyLimit
        },
        usageStats,
        dailyTrends
      }
    });
  } catch (error) {
    logger.error(`Error getting account stats: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Switch primary account
exports.switchAccount = async (req, res) => {
  try {
    // Find account and check if it belongs to the user
    const account = await DeepAIAccount.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // If account is already primary, return success
    if (account.isPrimary) {
      return res.json({
        success: true,
        message: 'Account is already set as primary'
      });
    }

    // Update all other accounts to not be primary
    await DeepAIAccount.updateMany(
      { createdBy: req.user.id },
      { isPrimary: false }
    );

    // Set this account as primary
    account.isPrimary = true;
    await account.save();

    return res.json({
      success: true,
      message: 'Account set as primary successfully',
      data: {
        id: account._id,
        name: account.name,
        email: account.email,
        isPrimary: account.isPrimary
      }
    });
  } catch (error) {
    logger.error(`Error switching account: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reset account usage
exports.resetAccountUsage = async (req, res) => {
  try {
    // Find account and check if it belongs to the user
    const account = await DeepAIAccount.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Reset usage counts
    account.usageCount.daily = 0;
    account.usageCount.monthly = 0;
    account.lastResetDate.daily = Date.now();
    account.lastResetDate.monthly = Date.now();
    
    await account.save();

    return res.json({
      success: true,
      message: 'Account usage reset successfully',
      data: {
        id: account._id,
        name: account.name,
        usageCount: account.usageCount,
        lastResetDate: account.lastResetDate
      }
    });
  } catch (error) {
    logger.error(`Error resetting account usage: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
