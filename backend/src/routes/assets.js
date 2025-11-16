const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const s3Service = require('../services/s3.service');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// All routes require authentication
router.use(authenticateToken);

// Upload image
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
    }

    // Generate unique filename
    const extension = req.file.originalname.split('.').pop();
    const key = `users/${req.user.id}/${uuidv4()}.${extension}`;

    // Upload to S3
    const url = await s3Service.uploadUserImage(key, req.file.buffer, req.file.mimetype);

    res.json({
      url,
      key,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
});

module.exports = router;

