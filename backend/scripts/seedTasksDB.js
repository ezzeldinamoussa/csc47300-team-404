// backend/scripts/seedTasksDB.js
const mongoose = require('mongoose');
const connectDB = require('../db');
const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');

async function seedTasksDB() {
  try {
    await connectDB();
    console.log('MongoDB connected!');

    // Clear old data
    await User.deleteMany({});
    await DailyRecord.deleteMany({});
    console.log('Old data cleared.');

    // Create sample users
    const users = await User.insertMany([
      {
        user_id: 'u1',
        username: 'alice',
        email: 'alice@email.com',
        password_hash: 'hashed_pw_1',
        join_date: '2025-03-01',
        timezone: 'America/New_York',
        preferred_theme: 'dark',
        total_points: 2450,
        current_streak: 7,
        highest_streak: 15,
        total_tasks_completed: 320,
        average_tasks_per_day: 5.1,
        daily_completion_summary: {
          '2025-10-10': 4,
          '2025-10-11': 6,
          '2025-10-12': 3,
        },
      },
      {
        user_id: 'u2',
        username: 'bob',
        email: 'bob@email.com',
        password_hash: 'hashed_pw_2',
        join_date: '2025-05-10',
        timezone: 'America/New_York',
        preferred_theme: 'light',
        total_points: 1520,
        current_streak: 5,
        highest_streak: 10,
        total_tasks_completed: 210,
        average_tasks_per_day: 4.2,
        daily_completion_summary: {
          '2025-10-10': 5,
          '2025-10-11': 4,
          '2025-10-12': 6,
        },
      },
    ]);

    console.log(`Inserted ${users.length} users.`);

    // Create sample daily records
    const dailyRecords = [
      {
        user_id: 'u1',
        date: '2025-10-14',
        total_tasks: 5,
        completed_tasks: 4,
        points_earned: 40,
        completion_rate: 0.8,
        tasks: [
          { title: 'Study Algorithms', description: 'Review dynamic programming' },
          { title: 'Write Journal', completed: true },
          { title: 'Go to Gym', description: 'Leg day', completed: true },
          { title: 'Meditate', completed: false },
          { title: 'Clean Room', completed: true },
        ],
      },
      {
        user_id: 'u2',
        date: '2025-10-14',
        total_tasks: 4,
        completed_tasks: 3,
        points_earned: 30,
        completion_rate: 0.75,
        tasks: [
          { title: 'Work on project report', completed: true },
          { title: 'Grocery shopping', completed: true },
          { title: 'Call mom', completed: true },
          { title: 'Read book', completed: false },
        ],
      },
      {
        user_id: 'u2',
        date: '2025-10-13',
        total_tasks: 3,
        completed_tasks: 2,
        points_earned: 20,
        completion_rate: 0.67,
        tasks: [
          { title: 'Watch tutorial', completed: true },
          { title: 'Write notes', completed: false },
          { title: 'Clean desk', completed: true },
        ],
      },
    ];

    await DailyRecord.insertMany(dailyRecords);
    console.log(`Inserted ${dailyRecords.length} daily records.`);

    console.log('Database seeding complete!');
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedTasksDB();
