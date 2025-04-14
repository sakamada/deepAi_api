const User = require('../models/User');
const ApiUsage = require('../models/ApiUsage');
const DeepAIAccount = require('../models/DeepAIAccount');

// Middleware to check if user is admin
exports.adminCheck = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin rights required.'
    });
  }
  next();
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user (self or admin)
exports.updateUser = async (req, res) => {
  try {
    const { email, username } = req.body;
    const user = await User.findById(req.user.id);

    // Check if new username or email already exists
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      user.email = email;
    }

    await user.save();

    return res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete user account
exports.deleteUser = async (req, res) => {
  try {
    // Find and delete user
    const user = await User.findByIdAndDelete(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Optional: Clean up related data
    await ApiUsage.deleteMany({ user: req.user.id });
    await DeepAIAccount.deleteMany({ createdBy: req.user.id });
    
    return res.json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user credits
exports.getUserCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    return res.json({
      success: true,
      data: {
        credits: user.credits
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add credits to user account (admin only)
exports.addCredits = async (req, res) => {
  try {
    const { userId, credits } = req.body;
    
    // Ensure only admin can add credits
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can add credits'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.credits += credits;
    await user.save();
    
    return res.json({
      success: true,
      data: {
        userId: user._id,
        newCreditsBalance: user.credits
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user usage statistics
exports.getUserUsageStats = async (req, res) => {
  try {
    // Aggregate API usage stats
    const usageStats = await ApiUsage.aggregate([
      { $match: { user: req.user._id } },
      { 
        $group: {
          _id: '$endpoint',
          totalRequests: { $sum: 1 },
          totalCreditsUsed: { $sum: '$creditsUsed' }
        }
      },
      { $sort: { totalRequests: -1 } }
    ]);
    
    // Daily usage breakdown
    const dailyUsage = await ApiUsage.aggregate([
      { $match: { user: req.user._id } },
      { 
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          dailyRequests: { $sum: 1 },
          dailyCreditsUsed: { $sum: '$creditsUsed' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return res.json({
      success: true,
      data: {
        usageStats,
        dailyUsage
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};