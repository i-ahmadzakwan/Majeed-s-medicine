// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login - Login
router.post('/login', authController.login);

// GET /api/auth/demo - Get demo accounts
router.get('/demo', authController.getDemoAccounts);

module.exports = router;