const mongoose = require('mongoose');
const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');
const connectDB = require('../db');

// Utility to create recent date strings
function getRecentDates(numDays = 10, endDate = new Date(2025, 9, 22)) {
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// Generate dummy completion summary with random task counts (2–8)
function generateDailySummary() {
  const dates = getRecentDates();
  const summary = {};
  dates.forEach((date) => {
    summary[date] = Math.floor(Math.random() * 7) + 2;
  });
  return summary;
}

async function seedData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const usersData = [
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
        daily_completion_summary: generateDailySummary(),
      },
      {
        user_id: 'u2',
        username: 'bob',
        email: 'bob@email.com',
        password_hash: 'hashed_pw_2',
        join_date: '2025-03-03',
        timezone: 'America/New_York',
        preferred_theme: 'light',
        total_points: 2100,
        current_streak: 4,
        highest_streak: 10,
        total_tasks_completed: 280,
        average_tasks_per_day: 4.8,
        daily_completion_summary: generateDailySummary(),
      },
      {
        user_id: 'u3',
        username: 'charlie',
        email: 'charlie@email.com',
        password_hash: 'hashed_pw_3',
        join_date: '2025-03-05',
        timezone: 'America/New_York',
        preferred_theme: 'dark',
        total_points: 3100,
        current_streak: 9,
        highest_streak: 18,
        total_tasks_completed: 400,
        average_tasks_per_day: 6.2,
        daily_completion_summary: generateDailySummary(),
      },
      {
        user_id: 'u4',
        username: 'diana',
        email: 'diana@email.com',
        password_hash: 'hashed_pw_4',
        join_date: '2025-03-10',
        timezone: 'America/New_York',
        preferred_theme: 'light',
        total_points: 1900,
        current_streak: 5,
        highest_streak: 9,
        total_tasks_completed: 250,
        average_tasks_per_day: 4.2,
        daily_completion_summary: generateDailySummary(),
      },
      {
        user_id: 'u5',
        username: 'ethan',
        email: 'ethan@email.com',
        password_hash: 'hashed_pw_5',
        join_date: '2025-03-15',
        timezone: 'America/New_York',
        preferred_theme: 'dark',
        total_points: 2750,
        current_streak: 8,
        highest_streak: 12,
        total_tasks_completed: 360,
        average_tasks_per_day: 5.7,
        daily_completion_summary: generateDailySummary(),
      },
    ];

    // Insert or update users
    for (const data of usersData) {
      const existing = await User.findOne({ user_id: data.user_id });
      if (existing) {
        await User.updateOne({ user_id: data.user_id }, { $set: data });
        console.log(`Updated user ${data.username}`);
      } else {
        await User.create(data);
        console.log(`Created user ${data.username}`);
      }

      // Create DailyRecords for the same 10 days
      for (const [date, completed] of Object.entries(data.daily_completion_summary)) {
        const existingRecord = await DailyRecord.findOne({ user_id: data.user_id, date });
        if (existingRecord) continue;

        const totalTasks = completed + Math.floor(Math.random() * 3); // total >= completed
        const completionRate = completed / totalTasks;
        const pointsEarned = completed * 10;

        const record = new DailyRecord({
          user_id: data.user_id,
          date,
          total_tasks: totalTasks,
          completed_tasks: completed,
          points_earned: pointsEarned,
          completion_rate: completionRate,
          tasks: [
            { title: 'Morning Routine', completed: true },
            { title: 'Study Algorithms', completed: completed > 2 },
            { title: 'Workout', completed: completed > 3 },
            { title: 'Read Book', completed: completed > 4 },
            { title: 'Plan Tomorrow', completed: completed > 5 },
          ],
        });

        await record.save();
      }
    }

    console.log('Seeding complete.');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error while seeding:', err);
    mongoose.connection.close();
  }
}

seedData();
