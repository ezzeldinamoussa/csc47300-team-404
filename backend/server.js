// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db.js'); // Use require

// Import routes
const authRoutes = require('./routes/auth');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parses JSON bodies

// --- Define Routes ---

// Health check route
app.get('/', (req, res) => {
  res.send('Backend API is running...');
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Example: basic users endpoint (placeholder)
app.get('/api/users', (req, res) => {
  res.json({ message: 'Users endpoint working!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const dailyRecordsRoutes = require('./routes/dailyrecords');
app.use('/api/dailyrecords', dailyRecordsRoutes);
