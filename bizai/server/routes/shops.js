const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const Product  = require('../models/Product');

// ── GET /api/shops  — list all seller shops (public) ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const query = { role: 'seller', isOpen: true };
    if (q) query.businessName = { $regex: q, $options: 'i' };

    const shops = await User.find(query)
      .select('_id businessName shopDescription shopAddress shopPhone shopCategory isOpen createdAt')
      .sort({ businessName: 1 });

    // Attach product count to each shop
    const shopsWithCount = await Promise.all(shops.map(async shop => {
      const count = await Product.countDocuments({ userId: shop._id, inStock: true });
      return { ...shop.toObject(), productCount: count };
    }));

    res.json({ success: true, data: shopsWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/shops/:id  — single shop details + inventory (public) ────────────
router.get('/:id', async (req, res) => {
  try {
    const shop = await User.findOne({ _id: req.params.id, role: 'seller' })
      .select('-password -__v');
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    const products = await Product.find({ userId: req.params.id }).sort({ inStock: -1, category: 1, name: 1 });
    res.json({ success: true, data: { shop, products } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
