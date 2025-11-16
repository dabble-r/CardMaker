const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
    });

    // Generate JWT
    const payload = { sub: user._id.toString(), email: user.email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { sub: user._id.toString(), email: user.email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;

