const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const mongoose = require('mongoose');

// Helper: safely cast string to ObjectId
const toId = (str) => new mongoose.Types.ObjectId(str);

// ── GET /api/orders  — seller sees their shop's orders ───────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const sellerId = toId(req.user.id);
    const orders = await Order.find({ shopId: sellerId })
      .sort({ createdAt: -1 })
      .limit(100);
    // Temporary debug — remove after issue is resolved
    console.log(`GET /orders: user=${req.user.id} role=${req.user.role} found=${orders.length}`);
    res.json({ success: true, data: orders, _debug: { queriedFor: req.user.id, found: orders.length } });
  } catch (err) {
    console.error('GET /orders error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/mine  — consumer sees their own orders ───────────────────
router.get('/mine', auth, async (req, res) => {
  try {
    const consumerId = toId(req.user.id);
    const orders = await Order.find({ consumerId })
      .sort({ createdAt: -1 })
      .populate('shopId', 'businessName shopAddress shopPhone')
      .limit(50);
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('GET /orders/mine error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/debug — diagnostic, no auth needed (remove after debugging)
router.get('/debug', async (req, res) => {
  try {
    const DEMO_SHOP_ID = '69e2207897c30d6c1023201f';

    // Test 1: raw count without any filter
    const totalOrders = await Order.countDocuments({});

    // Test 2: filter by shopId as STRING (no cast)
    const byString = await Order.find({ shopId: DEMO_SHOP_ID }).limit(5);

    // Test 3: filter by shopId as ObjectId (our current approach)
    const byObjectId = await Order.find({ shopId: toId(DEMO_SHOP_ID) }).limit(5);

    // Test 4: use the lean approach
    const byLean = await Order.find({ shopId: DEMO_SHOP_ID }).lean().limit(5);

    res.json({
      totalOrdersInDB: totalOrders,
      queryByString_count:   byString.length,
      queryByObjectId_count: byObjectId.length,
      queryByLean_count:     byLean.length,
      firstOrderShopIdType:  byLean[0] ? typeof byLean[0].shopId : 'no orders',
      firstOrderShopIdValue: byLean[0]?.shopId,
      message: byObjectId.length > 0
        ? '✅ ObjectId query works — frontend issue'
        : byString.length > 0
          ? '⚠️ String query works but ObjectId does not — type stored as string in DB'
          : '❌ No results either way — something else is wrong',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
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
    try { shopObjId = toId(shopId); }
    catch { return res.status(400).json({ success: false, message: 'Invalid shop ID.' }); }

    // Validate products belong to that shop (skip inStock — trust the UI)
    let total = 0;
    const enrichedItems = [];
    for (const item of items) {
      let prodId;
      try { prodId = toId(item.productId); }
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
      consumerId:    toId(req.user.id),
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
      { _id: toId(req.params.id), shopId: toId(req.user.id) },
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
    const sellerId = toId(req.user.id);
    const [total, pending, ready] = await Promise.all([
      Order.countDocuments({ shopId: sellerId }),
      Order.countDocuments({ shopId: sellerId, status: 'pending' }),
      Order.countDocuments({ shopId: sellerId, status: 'ready' }),
    ]);
    const revenue = await Order.aggregate([
      { $match: { shopId: sellerId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    res.json({ success: true, data: { total, pending, ready, completedRevenue: revenue[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
