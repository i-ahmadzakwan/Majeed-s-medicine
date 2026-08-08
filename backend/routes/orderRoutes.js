const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

const sendOrderEmail = async (order) => {
  try {
    const itemsList = order.items.map(item => 
      `${item.name} x${item.quantity} - Rs. ${item.subtotal}`
    ).join('\n');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Order: ${order.orderNumber}`,
      text: `New order received!\n\nOrder: ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone || 'N/A'}\nAddress: ${order.customerAddress || 'N/A'}\n\nItems:\n${itemsList}\n\nTotal: Rs. ${order.totalAmount}\nPayment: ${order.paymentMethod}`
    });
    console.log('✅ Order email sent');
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
  }
};


// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');

// ⚠️ IMPORTANT: Stats route MUST come BEFORE /:id routes
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
    console.error('Stats fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch statistics',
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
    console.error('Orders fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders',
      error: error.message 
    });
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
    console.error('Customer orders fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { 
      customerName, 
      customerId, 
      items, 
      totalAmount,
      subtotalAmount,
      orderDiscount,
      paymentMethod, 
      customerPhone, 
      customerAddress, 
      notes 
    } = req.body;
    
    const orderNumber = 'ORD-' + Date.now();
    
    // Verify and update stock, and get batch numbers
    const orderItems = [];
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
          message: `Insufficient stock for "${item.name}". Available: ${medicine.stock}` 
        });
      }
      
      // Deduct stock
      medicine.stock -= item.quantity;
      await medicine.save();
      
      // Add batch number and discount info to order item
      orderItems.push({
        medicineId: item.medicineId,
        name: item.name,
        batchNumber: medicine.batchNumber || 'N/A',
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        discountedPrice: item.discountedPrice || item.price,
        subtotal: item.subtotal
      });
    }
    
    const order = new Order({
      orderNumber,
      customerName,
      customerId,
      items: orderItems,
      subtotalAmount: subtotalAmount || totalAmount,
      orderDiscount: orderDiscount || { percentage: 0, amount: 0 },
      totalAmount,
      paymentMethod,
      customerPhone,
      customerAddress,
      notes,
      status: 'pending'
    });
    
    await order.save();
    
    // Send email notification (don't block the response if it fails)
    sendOrderEmail(order);
    
    res.status(201).json({ 
      success: true, 
      order,
      message: 'Order placed successfully' 
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order', 
      error: error.message 
    });
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
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update order status',
      error: error.message 
    });
  }
});

// Update order discount (Admin only)
router.patch('/:id/discount', async (req, res) => {
  try {
    const { discountPercentage, discountAmount } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // Update order discount
    order.orderDiscount = {
      percentage: discountPercentage || 0,
      amount: discountAmount || 0
    };
    
    // Recalculate total
    order.totalAmount = order.subtotalAmount - (discountAmount || 0);
    
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('Order discount update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update discount',
      error: error.message 
    });
  }
});

module.exports = router;