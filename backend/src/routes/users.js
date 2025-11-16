const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// Update user profile
router.put('/me', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    res.json({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

module.exports = router;

