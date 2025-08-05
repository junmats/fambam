const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const router = express.Router();

// Database connection (you might want to move this to a separate config file)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 3306
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Check if user is admin from token or fetch from database
    if (decoded.isAdmin) {
      req.user = decoded;
      return next();
    }
    
    // Double-check with database
    const db = await mysql.createConnection(dbConfig);
    const [users] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    );
    await db.end();

    if (users.length === 0 || !users[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await mysql.createConnection(dbConfig);

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await db.end();
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user (is_admin defaults to false)
    const [result] = await db.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    await db.end();

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.insertId,
        email,
        is_admin: false // New users are not admin by default
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await mysql.createConnection(dbConfig);

    // Find user
    const [users] = await db.execute(
      'SELECT id, email, password, is_admin FROM users WHERE email = ?',
      [email]
    );

    await db.end();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.is_admin },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = await mysql.createConnection(dbConfig);

    // Check if user exists
    const [users] = await db.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      await db.end();
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    await db.end();

    // In a real application, you would send an email here
    // For development, we'll return the token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: http://localhost:3000/reset-password?token=${resetToken}`);

    res.json({ 
      message: 'If the email exists, a reset link has been sent',
      // Remove this in production - only for development
      devResetToken: resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const db = await mysql.createConnection(dbConfig);

    // Find user with valid reset token
    const [users] = await db.execute(
      'SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      await db.end();
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await db.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    await db.end();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
