const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unit:        { type: String, default: 'piece' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  shopId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  consumerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  consumerName: { type: String, required: true },
  consumerPhone:{ type: String, default: '' },
  items:        [orderItemSchema],
  total:        { type: Number, required: true },
  status:       { type: String, enum: ['pending','confirmed','ready','completed','cancelled'], default: 'pending' },
  notes:        { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now, index: true },
  updatedAt:    { type: Date, default: Date.now },
});

orderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
