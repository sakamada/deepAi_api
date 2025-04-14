// Configuration keys for the application
// This file is for any application-specific constants

module.exports = {
  // Credit system
  creditPurchasePlans: {
    basic: {
      credits: 100,
      price: 9.99
    },
    standard: {
      credits: 500,
      price: 39.99
    },
    premium: {
      credits: 1000,
      price: 69.99
    }
  },
  
  // Default limits
  defaultLimits: {
    dailyRequests: 100,
    monthlyRequests: 1000
  },
  
  // API endpoint definitions
  endpoints: {
    text2img: {
      name: 'Text to Image',
      description: 'Generate images from text descriptions',
      path: 'text-to-image',
      qualityOptions: ['standard', 'hd', 'genius']
    },
    upscale: {
      name: 'Image Upscaling',
      description: 'Enhance resolution and quality of images',
      path: 'process-image',
      endpoint: 'torch-srgan'
    },
    colorize: {
      name: 'Image Colorization',
      description: 'Add or restore color to black and white images',
      path: 'process-image',
      endpoint: 'colorizer'
    },
    bgRemove: {
      name: 'Background Removal',
      description: 'Remove backgrounds from images',
      path: 'process-image',
      endpoint: 'background-remover'
    },
    imageEdit: {
      name: 'Image Editor',
      description: 'Edit images with AI assistance',
      path: 'process-image',
      endpoint: 'image-editor'
    }
  }
};
