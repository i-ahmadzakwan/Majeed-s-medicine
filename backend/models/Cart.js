// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);