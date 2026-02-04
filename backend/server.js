// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');


// Import routes
const medicineRoutes = require('./routes/medicineRoutes');
const authRoutes = require('./routes/authRoutes');
// Add this line with other route imports
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware - Updated CORS for production
app.use(cors({
  origin: [
    'https://majeed-s-medicine.vercel.app',
    'http://localhost:8080',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Majeed Medicines API is running!' });
});

app.use('/api/medicines', medicineRoutes);
app.use('/api/auth', authRoutes);
// Add this line with other route uses
app.use('/api/cart', cartRoutes);
// Add with other routes
app.use('/api/orders', orderRoutes);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});