const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, businessName, role = 'seller', shopAddress, shopPhone, shopCategory } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (role === 'seller' && !businessName)
      return res.status(400).json({ success: false, message: 'Shop name is required for sellers.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const user  = await new User({ name, email, password, businessName: businessName || '', role, shopAddress, shopPhone, shopCategory }).save();
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, businessName: user.businessName, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ success: true, data: { token, user: { id: user._id, name: user.name, email: user.email, businessName: user.businessName, role: user.role } } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user  = await User.findOne({ email });
    const valid = user && (await user.comparePassword(password));
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, businessName: user.businessName, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, data: { token, user: { id: user._id, name: user.name, email: user.email, businessName: user.businessName, role: user.role } } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    const user  = await User.findById(req.user.id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
});

module.exports = router;
