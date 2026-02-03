// controllers/cartController.js
const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const { username } = req.query;
    
    let cart = await Cart.findOne({ user: username }).populate('items.medicine');
    
    if (!cart) {
      cart = await Cart.create({ user: username, items: [], total: 0 });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { username, medicineId } = req.body;
    
    // Check medicine stock
    const medicine = await Medicine.findById(medicineId);
    if (!medicine || medicine.stock <= 0) {
      return res.status(400).json({ message: 'Medicine not available' });
    }
    
    let cart = await Cart.findOne({ user: username });
    
    if (!cart) {
      cart = await Cart.create({ user: username, items: [], total: 0 });
    }
    
    // Check if item already in cart
    const existingItem = cart.items.find(
      item => item.medicine.toString() === medicineId
    );
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        medicine: medicineId,
        quantity: 1,
        price: medicine.price
      });
    }
    
    // Calculate total
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.medicine');
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { username, medicineId } = req.body;
    
    const cart = await Cart.findOne({ user: username });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(
      item => item.medicine.toString() !== medicineId
    );
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.medicine');
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update cart item quantity - NEW FUNCTION
exports.updateCartQuantity = async (req, res) => {
  try {
    const { username, medicineId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: username });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.medicine.toString() === medicineId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Check medicine stock
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (quantity > medicine.stock) {
      return res.status(400).json({ 
        message: `Only ${medicine.stock} units available in stock` 
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.medicine');

    res.json(cart);
  } catch (error) {
    console.error('Update cart quantity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const { username } = req.body;
    
    const cart = await Cart.findOne({ user: username });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    cart.total = 0;
    
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Checkout
exports.checkout = async (req, res) => {
  try {
    const { username } = req.body;
    
    const cart = await Cart.findOne({ user: username }).populate('items.medicine');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Reduce stock for each item
    for (const item of cart.items) {
      const medicine = await Medicine.findById(item.medicine._id);
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${medicine.name}` 
        });
      }
      medicine.stock -= item.quantity;
      await medicine.save();
    }
    
    // Clear cart after successful checkout
    const orderTotal = cart.total;
    cart.items = [];
    cart.total = 0;
    await cart.save();
    
    res.json({ 
      success: true, 
      message: 'Order placed successfully',
      orderTotal 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};