const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

// Upload and process photo
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
    // If we already cropped, the image should be square, so use 'fill' instead of 'cover'
    const optimizedBuffer = await sharp(processedBuffer)
      .resize(300, 300, { 
        fit: cropData ? 'fill' : 'cover',  // Use 'fill' if already cropped, 'cover' if not
        position: 'center'
      })
      .jpeg({ 
        quality: 75,
        progressive: true,
        mozjpeg: true 
      })
      .toBuffer();

    // Generate unique filename
    const fileName = `${uuidv4()}.jpg`;
    const filePath = path.join(__dirname, '../uploads/photos', fileName);
    console.log('Saving file to:', filePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Save the file
    await fs.writeFile(filePath, optimizedBuffer);
    console.log('File saved successfully');

    // Return the photo information
    res.json({
      success: true,
      photoUrl: `/api/photos/${fileName}`,
      fileName: fileName,
      originalSize: req.file.size,
      optimizedSize: optimizedBuffer.length
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo', details: error.message });
  }
});

// Serve photos
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/photos', filename);
  
  // Security check - ensure filename is safe
  if (!filename.match(/^[a-f0-9-]+\.jpg$/)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving photo:', err);
      res.status(404).json({ error: 'Photo not found' });
    }
  });
});

// Delete photo
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security check
    if (!filename.match(/^[a-f0-9-]+\.jpg$/)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, '../uploads/photos', filename);
    
    try {
      await fs.unlink(filePath);
      res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Photo not found' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;
