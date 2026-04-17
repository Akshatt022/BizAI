const express  = require('express');
const router   = express.Router();
const Customer = require('../models/Customer');
const auth     = require('../middleware/auth');

router.use(auth);

// ── GET /api/customers ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch customers.' });
  }
});

// ── POST /api/customers ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, isNewCustomer, visitCount } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    const customer = await new Customer({
      userId:     req.user.id,
      name,
      email:      email || '',
      isNewCustomer: isNewCustomer !== undefined ? Boolean(isNewCustomer) : true,
      visitCount:    visitCount || 1,
    }).save();

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    console.error('Add customer error:', err);
    res.status(500).json({ success: false, message: 'Could not add customer.' });
  }
});

// ── DELETE /api/customers/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    await customer.deleteOne();
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ success: false, message: 'Could not delete customer.' });
  }
});

// ── GET /api/customers/stats ──────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);

    const [totalCustomers, newThisWeek, returningCustomers] = await Promise.all([
      Customer.countDocuments({ userId: req.user.id }),
      Customer.countDocuments({ userId: req.user.id, isNewCustomer: true, date: { $gte: thisWeekStart } }),
      Customer.countDocuments({ userId: req.user.id, isNewCustomer: false }),
    ]);

    res.json({ success: true, data: { totalCustomers, newThisWeek, returningCustomers } });
  } catch (err) {
    console.error('Customer stats error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch customer stats.' });
  }
});

module.exports = router;
