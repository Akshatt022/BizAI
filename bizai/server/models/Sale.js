const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount:      { type: Number, required: true, min: 0 },
  description: { type: String, trim: true, default: '' },
  category: {
    type: String,
    enum: ['Food & Beverages', 'Electronics', 'Clothing', 'Services', 'Groceries', 'Health & Beauty', 'Other'],
    default: 'Other',
  },
  date: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Sale', saleSchema);
