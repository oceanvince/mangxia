const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // TODO: Replace with actual user lookup from database
    const dummyUser = {
      id: 1,
      username: 'doctor',
      passwordHash: '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    };

    // TODO: Implement proper password verification
    const token = jwt.sign(
      { userId: dummyUser.id, username: dummyUser.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router; 