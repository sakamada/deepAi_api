const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const DeepAIAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  apiKey: {
    type: Object,
    required: true,
    select: false, // Don't include by default in query results
    iv: String,
    encryptedData: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  dailyLimit: {
    type: Number,
    default: 500 // Default daily limit for DeepAI Pro
  },
  monthlyLimit: {
    type: Number,
    default: 500 // Default monthly limit for DeepAI Pro
  },
  usageCount: {
    daily: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  lastResetDate: {
    daily: {
      type: Date,
      default: Date.now
    },
    monthly: {
      type: Date,
      default: Date.now
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Encrypt API key before saving
DeepAIAccountSchema.pre('save', function(next) {
  if (this.isModified('apiKey') && typeof this.apiKey === 'string') {
    const encrypted = encrypt(this.apiKey, process.env.ENCRYPTION_KEY);
    this.apiKey = encrypted;
  }
  next();
});

// Method to get decrypted API key
DeepAIAccountSchema.methods.getDecryptedApiKey = function() {
  return decrypt(this.apiKey.encryptedData, this.apiKey.iv, process.env.ENCRYPTION_KEY);
};

module.exports = mongoose.model('DeepAIAccount', DeepAIAccountSchema);
