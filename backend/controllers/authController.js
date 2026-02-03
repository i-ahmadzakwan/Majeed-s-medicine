// controllers/authController.js

// Hardcoded users with roles
const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'customer', password: 'customer123', role: 'customer' },
  { username: 'user1', password: 'user123', role: 'customer' }
];

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      res.json({ 
        success: true, 
        message: 'Login successful',
        user: { 
          username: user.username,
          role: user.role 
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available demo accounts
exports.getDemoAccounts = (req, res) => {
  res.json({
    accounts: users.map(u => ({
      username: u.username,
      password: u.password,
      role: u.role
    }))
  });
};