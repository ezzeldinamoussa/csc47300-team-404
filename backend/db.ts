// backend/db.js
const mongoose = require('mongoose');

async function connectDB() {
  try {
    // Connect using the connection string from your .env file or default
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/TasksDB');
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

export default connectDB;