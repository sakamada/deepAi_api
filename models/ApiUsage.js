const mongoose = require('mongoose');

const ApiUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  deepAiAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeepAIAccount'
  },
  creditsUsed: {
    type: Number,
    required: true
  },
  parameters: {
    type: Object
  },
  responseStatus: {
    type: Number
  },
  responseTime: {
    type: Number
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ApiUsage', ApiUsageSchema);
