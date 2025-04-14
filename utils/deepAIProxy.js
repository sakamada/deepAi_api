const axios = require('axios');
const DeepAIAccount = require('../models/DeepAIAccount');
const ApiUsage = require('../models/ApiUsage');
const logger = require('./logger');
const { decrypt } = require('./encryption');

// Base DeepAI API URL 
const DEEPAI_API_URL = 'https://api.deepai.org/api/';

// Credit mapping for different endpoints 
const CREDIT_MAPPING = { 
  'text2img': { standard: 1, hd: 2, genius: 3 }, 
  'torch-srgan': 1, 
  'colorizer': 1, 
  'background-remover': 1, 
  'image-editor': 2, 
  'studio-ghibli': 2, 
  'waifu2x': 1, 
  'creative-upscale': 1, 
  'image-replace': 2, 
  'zoom-out': 1, 
  'ai-headshots': 3, 
  'ai-selfie-generator': 2 
};

// Get active account that hasn't reached its limit 
const getAvailableAccount = async () => { 
  // First try to get the primary account that's active and not over limit 
  let account = await DeepAIAccount.findOne({ 
    isActive: true, 
    isPrimary: true, 
    $or: [ 
      { 'usageCount.daily': { $lt: '$dailyLimit' } }, 
      { 'usageCount.monthly': { $lt: '$monthlyLimit' } } 
    ]
  }).select('+apiKey');
  
  // If no primary account is available, try to get any available account 
  if (!account) { 
    account = await DeepAIAccount.findOne({ 
      isActive: true, 
      $or: [ 
        { 'usageCount.daily': { $lt: '$dailyLimit' } }, 
        { 'usageCount.monthly': { $lt: '$monthlyLimit' } } 
      ]
    }).select('+apiKey');
  }
  
  if (!account) {
    throw new Error('No available DeepAI account found');
  }

  return account;
};

// Track usage of an account
const incrementAccountUsage = async (accountId) => {
  try {
    const account = await DeepAIAccount.findById(accountId);
    if (!account) return;

    // Increment usage counters
    account.usageCount.daily += 1;
    account.usageCount.monthly += 1;
    account.usageCount.total += 1;

    await account.save();
  } catch (error) {
    logger.error(`Error incrementing account usage: ${error.message}`);
  }
};

// Call DeepAI API
const callDeepAIApi = async (endpoint, params, userId) => {
  try {
    // Get available account
    const account = await getAvailableAccount();
    
    // Get decrypted API key
    const decryptedKey = decrypt(
      account.apiKey.encryptedData,
      account.apiKey.iv,
      process.env.ENCRYPTION_KEY
    );

    // Prepare form data
    const formData = new FormData();
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }

    // Make API request
    const startTime = Date.now();
    const response = await axios.post(`${DEEPAI_API_URL}${endpoint}`, formData, {
      headers: {
        'api-key': decryptedKey,
        ...formData.getHeaders()
      }
    });

    const responseTime = Date.now() - startTime;

    // Calculate credits used
    let creditsUsed = 1; // Default
    if (CREDIT_MAPPING[endpoint]) {
      if (typeof CREDIT_MAPPING[endpoint] === 'object') {
        // Handle quality-based pricing
        const quality = params.quality || 'standard';
        creditsUsed = CREDIT_MAPPING[endpoint][quality] || 1;
      } else {
        creditsUsed = CREDIT_MAPPING[endpoint];
      }
    }

    // Record API usage
    await ApiUsage.create({
      user: userId,
      endpoint,
      deepAiAccount: account._id,
      creditsUsed,
      parameters: params,
      responseStatus: response.status,
      responseTime,
    });

    // Update account usage
    await incrementAccountUsage(account._id);

    return {
      success: true,
      data: response.data,
      creditsUsed
    };
  } catch (error) {
    logger.error(`DeepAI API error: ${error.message}`);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500
    };
  }
};

module.exports = { 
  callDeepAIApi,
  getAvailableAccount,
  incrementAccountUsage,
  CREDIT_MAPPING
};
