const User = require('../models/User');
const { callDeepAIApi } = require('../utils/deepAIProxy');
const asyncHandler = require('../utils/asyncHandler');
const keys = require('../config/keys');

// Get all available endpoints
exports.getEndpoints = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: keys.endpoints
  });
});

// Text to Image endpoint
exports.textToImage = asyncHandler(async (req, res) => {
  const { prompt, width, height, quality, negative_prompt } = req.body;
  
  // Validate input
  if (!prompt) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is required'
    });
  }

  // Determine credits required based on quality
  let creditsRequired = 1;
  if (quality === 'hd') creditsRequired = 2;
  if (quality === 'genius') creditsRequired = 3;

  // Check if user has enough credits
  const user = await User.findById(req.user.id);
  if (user.credits < creditsRequired) {
    return res.status(400).json({
      success: false,
      message: `Not enough credits. Required: ${creditsRequired}, Available: ${user.credits}`
    });
  }

  // Prepare parameters
  const params = {
    text: prompt,
  };
  
  if (width && height) {
    params.width = width;
    params.height = height;
  }
  
  if (negative_prompt) {
    params.negative_prompt = negative_prompt;
  }
  
  if (quality) {
    params.quality = quality;
  }

  // Call DeepAI API
  const response = await callDeepAIApi('text2img', params, req.user.id);
  
  if (!response.success) {
    return res.status(response.status || 500).json({
      success: false,
      message: response.message || 'Error generating image'
    });
  }

  // Deduct credits from user
  user.credits -= creditsRequired;
  await user.save();

  res.json({
    success: true,
    data: response.data,
    creditsUsed: creditsRequired,
    creditsRemaining: user.credits
  });
});

// Process image with various endpoints
exports.processImage = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  const files = req.files;
  
  // Validate input
  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Endpoint is required'
    });
  }
  
  if (!files || !files.image || !files.image[0]) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required'
    });
  }
  
  // Get credit requirement for this endpoint
  const creditsRequired = 1; // Default to 1 credit

  // Check if user has enough credits
  const user = await User.findById(req.user.id);
  if (user.credits < creditsRequired) {
    return res.status(400).json({
      success: false,
      message: `Not enough credits. Required: ${creditsRequired}, Available: ${user.credits}`
    });
  }

  // Prepare parameters
  const params = {
    image: {
      value: files.image[0].buffer,
      options: {
        filename: files.image[0].originalname,
        contentType: files.image[0].mimetype
      }
    }
  };
  
  // Add any additional parameters from request body
  Object.keys(req.body).forEach(key => {
    if (key !== 'endpoint') {
      params[key] = req.body[key];
    }
  });

  // Call DeepAI API
  const response = await callDeepAIApi(endpoint, params, req.user.id);
  
  if (!response.success) {
    return res.status(response.status || 500).json({
      success: false,
      message: response.message || 'Error processing image'
    });
  }

  // Deduct credits from user
  user.credits -= creditsRequired;
  await user.save();

  res.json({
    success: true,
    data: response.data,
    creditsUsed: creditsRequired,
    creditsRemaining: user.credits
  });
});
