const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name:       { type: String, required: true, trim: true },
  email:      { type: String, lowercase: true, trim: true, default: '' },
  isNewCustomer: { type: Boolean, default: true },
  visitCount: { type: Number, default: 1 },
  date:       { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Customer', customerSchema);
