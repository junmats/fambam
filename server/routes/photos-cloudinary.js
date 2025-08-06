const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Configure multer for memory storage (we'll process in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload and process photo to Cloudinary
router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
  console.log('=== Photo Upload Request ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'No file');
  
  try {
    if (!req.file) {
      console.log('ERROR: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let processedBuffer = req.file.buffer;

    // Optional: If crop data is provided, crop the image first
    const { cropData } = req.body;
    if (cropData) {
      try {
        console.log('Processing crop data:', cropData);
        const crop = JSON.parse(cropData);
        processedBuffer = await sharp(req.file.buffer)
          .extract({
            left: Math.round(crop.x),
            top: Math.round(crop.y),
            width: Math.round(crop.width),
            height: Math.round(crop.height)
          })
          .toBuffer();
      } catch (cropError) {
        console.warn('Could not parse crop data:', cropError);
        // Continue without cropping
      }
    }

    console.log('Resizing and optimizing image...');
    // Resize and optimize the image for smaller file size
    const optimizedBuffer = await sharp(processedBuffer)
      .resize(300, 300, { 
        fit: cropData ? 'fill' : 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 75,
        progressive: true,
        mozjpeg: true 
      })
      .toBuffer();

    // Generate unique public ID for Cloudinary
    const publicId = `fambam/photos/${uuidv4()}`;

    console.log('Uploading to Cloudinary...');
    // Upload to Cloudinary
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: publicId,
          folder: 'fambam/photos',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'center' },
            { quality: 'auto:good' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', result.secure_url);
            resolve(result);
          }
        }
      ).end(optimizedBuffer);
    });

    // Return the photo information
    res.json({
      success: true,
      photoUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      originalSize: req.file.size,
      optimizedSize: optimizedBuffer.length
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo', details: error.message });
  }
});

// Delete photo from Cloudinary
router.delete('/:publicId', authenticateToken, async (req, res) => {
  try {
    const publicId = req.params.publicId;
    
    // Security check - ensure publicId follows expected format
    if (!publicId.startsWith('fambam/photos/')) {
      return res.status(400).json({ error: 'Invalid photo ID' });
    }
    
    console.log('Deleting from Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ success: true, message: 'Photo deleted successfully' });
    } else {
      res.status(404).json({ error: 'Photo not found or already deleted' });
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME 
  });
});

module.exports = router;
