// models/Medicine.js
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Medicine', medicineSchema);