// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User'); // Correct path to your User model

// --- User Registration (Signup) ---
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, "confirm-password": confirmPassword } = req.body;

  // 1. Basic Validation
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match.' });
  }

  try {
    // 2. Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User with this email or username already exists.' });
    }

    // 3. Create new user object
    user = new User({
      user_id: uuidv4(), // Generate a unique user_id
      username,
      email,
      password_hash: password, // Will be hashed next
      join_date: new Date().toISOString(),
      // Other fields will use defaults from the schema
    });

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);

    // 5. Save user to database
    await user.save();

    res.status(201).json({ msg: 'User registered successfully! Please login.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// --- User Login ---
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body; // HTML form uses 'username' for both

  // 1. Basic Validation
  if (!username || !password) {
    return res.status(400).json({ msg: 'Please provide credentials.' });
  }

  try {
    // 2. Find user by email or username
    const user = await User.findOne({ 
      $or: [{ email: username }, { username: username }] 
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    // 4. Create and sign JWT
    const payload = {
      user: {
        id: user.user_id, // Use your unique user_id
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Send token back to client
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;