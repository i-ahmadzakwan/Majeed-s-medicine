const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');

// Create new order
router.post('/', async (req, res) => {
  try {
    const { 
      customerName, 
      customerId, 
      items, 
      totalAmount, 
      paymentMethod, 
      customerPhone, 
      customerAddress, 
      notes 
    } = req.body;
    
    const orderNumber = 'ORD-' + Date.now();
    
    // Verify and update stock
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      
      if (!medicine) {
        return res.status(404).json({ 
          success: false,
          message: `Medicine "${item.name}" not found` 
        });
      }
      
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: `Insufficient stock for "${item.name}"` 
        });
      }
      
      medicine.stock -= item.quantity;
      await medicine.save();
    }
    
    const order = new Order({
      orderNumber,
      customerName,
      customerId,
      items,
      totalAmount,
      paymentMethod,
      customerPhone,
      customerAddress,
      notes,
      status: 'pending'
    });
    
    await order.save();
    
    res.status(201).json({ 
      success: true, 
      order,
      message: 'Order placed successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order', 
      error: error.message 
    });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get customer orders
router.get('/customer/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ 
      customerId: req.params.customerId 
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        completedAt: status === 'completed' ? new Date() : undefined
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;