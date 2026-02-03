// controllers/medicineController.js
const Medicine = require('../models/Medicine');

// Get all medicines
exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new medicine
exports.addMedicine = async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const medicine = new Medicine({ name, price, stock });
    const savedMedicine = await medicine.save();
    res.status(201).json(savedMedicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const deleted = await Medicine.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Buy medicine (reduce stock)
exports.buyMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    if (medicine.stock <= 0) {
      return res.status(400).json({ message: 'Out of stock' });
    }
    medicine.stock -= 1;
    const updated = await medicine.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};