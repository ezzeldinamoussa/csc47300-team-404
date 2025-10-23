const mongoose = require('mongoose');
const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');
const connectDB = require('../db');

async function clearDB() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const userCount = await User.countDocuments();
    const recordCount = await DailyRecord.countDocuments();

    if (userCount === 0 && recordCount === 0) {
      console.log('Database is already empty.');
      process.exit(0);
    }

    await User.deleteMany({});
    await DailyRecord.deleteMany({});

    console.log(`Cleared ${userCount} users and ${recordCount} daily records.`);
    mongoose.connection.close();
  } catch (err) {
    console.error('Error clearing database:', err);
    mongoose.connection.close();
  }
}

clearDB();
