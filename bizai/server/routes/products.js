const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const Product  = require('../models/Product');

// ── GET /api/products  — seller's own inventory ───────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/products  — add product ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, stock, category, unit } = req.body;
    if (!name || price == null) return res.status(400).json({ success: false, message: 'Name and price are required.' });
    const product = await Product.create({ userId: req.user.id, name, description, price, stock: stock || 0, category: category || 'General', unit: unit || 'piece' });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/products/:id  — update product ───────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const { name, description, price, stock, category, unit } = req.body;
    if (name        != null) product.name        = name;
    if (description != null) product.description = description;
    if (price       != null) product.price       = price;
    if (stock       != null) product.stock       = stock;
    if (category    != null) product.category    = category;
    if (unit        != null) product.unit        = unit;
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/products/shop/:shopId  — PUBLIC: shop's inventory ────────────────
router.get('/shop/:shopId', async (req, res) => {
  try {
    const products = await Product.find({ userId: req.params.shopId, inStock: true }).sort({ category: 1, name: 1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
