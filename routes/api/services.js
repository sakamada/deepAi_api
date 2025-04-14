const express = require('express');
const router = express.Router();
const serviceController = require('../../controllers/serviceController');
const authMiddleware = require('../../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB file size limit
  }
});

// Service Endpoints
router.get('/endpoints', authMiddleware, serviceController.getEndpoints);

// Image Generation Endpoints
router.post('/text-to-image', authMiddleware, serviceController.textToImage);
router.post('/process-image', 
  authMiddleware, 
  upload.fields([{ name: 'image', maxCount: 1 }]), 
  serviceController.processImage
);

module.exports = router;