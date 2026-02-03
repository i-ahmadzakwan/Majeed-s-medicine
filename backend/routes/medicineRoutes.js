// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

// GET /api/medicines - Get all medicines
router.get('/', medicineController.getAllMedicines);

// POST /api/medicines - Add new medicine
router.post('/', medicineController.addMedicine);

// DELETE /api/medicines/:id - Delete medicine
router.delete('/:id', medicineController.deleteMedicine);

// POST /api/medicines/buy/:id - Buy medicine (reduce stock)
router.post('/buy/:id', medicineController.buyMedicine);

module.exports = router;