import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import otpService from '../services/otp.service.js';
import emailService from '../services/email.service.js';

const router = express.Router();

// Step 1: Request OTP for registration
router.post('/register/request', verifyCaptcha, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create and send OTP
    const result = await otpService.createAndSendOTP(email);

    res.json(result);
  } catch (error) {
    console.error('Registration request error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Step 2: Verify OTP
router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Verify OTP
    const result = otpService.verifyOTP(email, otpCode);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Step 3: Complete registration with password
router.post('/register/complete', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Verify that email was verified
    if (!otpService.isEmailVerified(email)) {
      return res.status(400).json({ error: 'Email not verified. Please verify your email first.' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash);

    // Generate JWT
    const token = jwt.sign({ userId: result.lastInsertRowid, email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Send welcome email (don't wait for it)
    emailService.sendWelcomeEmail(email).catch(err => console.error('Welcome email error:', err));

    res.json({
      success: true,
      token,
      user: { id: result.lastInsertRowid, email }
    });
  } catch (error) {
    console.error('Registration completion error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// Resend OTP
router.post('/register/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await otpService.resendOTP(email);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// Old register endpoint (deprecated - kept for backward compatibility)
router.post('/register', verifyCaptcha, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash);

    // Generate JWT
    const token = jwt.sign({ userId: result.lastInsertRowid, email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      user: { id: result.lastInsertRowid, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', verifyCaptcha, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.user.userId);
  res.json({ user });
});

export default router;
