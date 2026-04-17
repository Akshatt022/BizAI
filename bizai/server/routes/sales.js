const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Sale     = require('../models/Sale');
const auth     = require('../middleware/auth');

// All routes require valid JWT
router.use(auth);

// ── GET /api/sales — fetch all sales for current user ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: sales });
  } catch (err) {
    console.error('Get sales error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch sales.' });
  }
});

// ── DELETE /api/sales/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, userId: req.user.id });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found.' });
    await sale.deleteOne();
    res.json({ success: true, message: 'Sale deleted.' });
  } catch (err) {
    console.error('Delete sale error:', err);
    res.status(500).json({ success: false, message: 'Could not delete sale.' });
  }
});

// ── POST /api/sales — add a sale ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive amount is required.' });
    }

    const sale = await new Sale({
      userId:      req.user.id,
      amount:      parseFloat(amount),
      description: description || '',
      category:    category || 'Other',
      date:        date ? new Date(date) : new Date(),
    }).save();

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    console.error('Add sale error:', err);
    res.status(500).json({ success: false, message: 'Could not add sale.' });
  }
});

// ── GET /api/sales/weekly — last 7 days aggregated by day ─────────────────────
router.get('/weekly', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const raw = await Sale.aggregate([
      { $match: { userId, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Ensure all 7 days are present (fill gaps with 0)
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found   = raw.find((r) => r._id === dateStr);
      result.push({
        date:  dateStr,
        day:   d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: found ? found.total : 0,
        count: found ? found.count : 0,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Weekly sales error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch weekly data.' });
  }
});

// ── GET /api/sales/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now    = new Date();

    // This week: last 7 days
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);

    // Last week: 7 days before this week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);

    const [totalRes, thisWeekRes, lastWeekRes] = await Promise.all([
      Sale.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { userId, date: { $gte: thisWeekStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { userId, date: { $gte: lastWeekStart, $lt: lastWeekEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue    = totalRes[0]?.total    || 0;
    const thisWeekRevenue = thisWeekRes[0]?.total  || 0;
    const lastWeekRevenue = lastWeekRes[0]?.total  || 0;
    const thisWeekCount   = thisWeekRes[0]?.count  || 0;

    const percentChange =
      lastWeekRevenue === 0
        ? thisWeekRevenue > 0 ? 100 : 0
        : Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100);

    res.json({
      success: true,
      data: { totalRevenue, thisWeekRevenue, lastWeekRevenue, thisWeekCount, percentChange },
    });
  } catch (err) {
    console.error('Sales stats error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch sales stats.' });
  }
});

module.exports = router;
