const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const mongoose = require('mongoose');

// ── GET /api/orders  — seller sees their shop's orders ───────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ shopId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/mine  — consumer sees their own orders ───────────────────
router.get('/mine', auth, async (req, res) => {
  try {
    const orders = await Order.find({ consumerId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('shopId', 'businessName shopAddress')
      .limit(50);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/orders  — consumer places an order ─────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { shopId, items, notes, consumerPhone } = req.body;
    if (!shopId || !items?.length)
      return res.status(400).json({ success: false, message: 'shopId and items are required.' });

    // Cast shopId to ObjectId so Mongoose comparison is reliable
    let shopObjId;
    try { shopObjId = new mongoose.Types.ObjectId(shopId); }
    catch { return res.status(400).json({ success: false, message: 'Invalid shop ID.' }); }

    // Validate products belong to that shop (skip inStock — trust the UI)
    let total = 0;
    const enrichedItems = [];
    for (const item of items) {
      let prodId;
      try { prodId = new mongoose.Types.ObjectId(item.productId); }
      catch { return res.status(400).json({ success: false, message: `Invalid product ID for ${item.name}.` }); }

      const product = await Product.findOne({ _id: prodId, userId: shopObjId });
      if (!product)
        return res.status(400).json({ success: false, message: `Product "${item.name || 'Unknown'}" not found in this shop.` });

      const qty = parseInt(item.quantity) || 1;
      total += product.price * qty;
      enrichedItems.push({
        productId: product._id,
        name:      product.name,
        price:     product.price,
        quantity:  qty,
        unit:      product.unit,
      });
    }

    const order = await Order.create({
      shopId:        shopObjId,
      consumerId:    new mongoose.Types.ObjectId(req.user.id),
      consumerName:  req.user.name,
      consumerPhone: consumerPhone || '',
      items:         enrichedItems,
      total,
      notes:         notes || '',
    });

    res.status(201).json({ success: true, data: order, message: 'Order placed! Come to the shop and pay when you pick up.' });
  } catch (err) {
    console.error('Order create error:', err.message);
    res.status(500).json({ success: false, message: 'Could not place order. Please try again.' });
  }
});

// ── PATCH /api/orders/:id/status  — seller updates order status ──────────────
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','ready','completed','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user.id },
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/stats — seller order stats for dashboard ─────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const [total, pending, ready] = await Promise.all([
      Order.countDocuments({ shopId: req.user.id }),
      Order.countDocuments({ shopId: req.user.id, status: 'pending' }),
      Order.countDocuments({ shopId: req.user.id, status: 'ready' }),
    ]);
    const revenue = await Order.aggregate([
      { $match: { shopId: req.user._id || req.user.id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    res.json({ success: true, data: { total, pending, ready, completedRevenue: revenue[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
