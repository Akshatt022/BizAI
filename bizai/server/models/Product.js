const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  category:    { type: String, default: 'General' },
  unit:        { type: String, default: 'piece' },  // e.g. kg, litre, piece
  inStock:     { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
});

// Auto-update inStock based on stock count
productSchema.pre('save', function (next) {
  this.inStock = this.stock > 0;
  next();
});

module.exports = mongoose.model('Product', productSchema);
