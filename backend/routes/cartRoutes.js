// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// GET /api/cart?username=admin - Get user's cart
router.get('/', cartController.getCart);

// POST /api/cart/add - Add item to cart
router.post('/add', cartController.addToCart);

// POST /api/cart/remove - Remove item from cart
router.post('/remove', cartController.removeFromCart);

// PATCH /api/cart/update - Update cart item quantity (NEW)
router.patch('/update', cartController.updateCartQuantity);

// POST /api/cart/clear - Clear cart
router.post('/clear', cartController.clearCart);

// POST /api/cart/checkout - Checkout
router.post('/checkout', cartController.checkout);

module.exports = router;