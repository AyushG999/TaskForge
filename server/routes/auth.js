const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    // check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // create new user
    user = new User({ name, email, password });
    await user.save();

    // generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// POST /api/auth/forgot-password
// generates a reset token and returns it (in production, this would send an email)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // don't reveal if email exists or not (security best practice)
      return res.json({ message: 'If an account with that email exists, a reset link has been generated.' });
    }

    // generate reset token using JWT (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET + user.password, // salt with current password hash so token invalidates after password change
      { expiresIn: '1h' }
    );

    // in a real app, you'd send this via email
    // for this assignment, we return the token directly
    res.json({
      message: 'If an account with that email exists, a reset link has been generated.',
      resetToken // in production, remove this and send via email instead
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { token, newPassword } = req.body;

    // first decode without verification to get the userId
    let decoded;
    try {
      decoded = jwt.decode(token);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (!decoded || decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // verify the token with the user's current password hash as salt
    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
