import mongoose from 'mongoose'; 

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,          // Must be unique
  },
  username: {
    type: String,
    required: true,
    unique: true,          // Must be unique
  },
  email: {
    type: String,
    required: true,
    unique: true,          // Must be unique
  },
  password_hash: {
    type: String,
    required: true,
  },
  join_date: {
    type: String,
  },
  timezone: {
    type: String,
  },
  preferred_theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  },
  total_points: {
    type: Number,
    default: 0,
  },
  current_streak: {
    type: Number,
    default: 0,
  },
  highest_streak: {
    type: Number,
    default: 0,
  },
  total_tasks_completed: {
    type: Number,
    default: 0,
  },
  average_tasks_per_day: {
    type: Number,
    default: 0,
  },
  daily_completion_summary: {
    type: Map,
    of: Number,
    default: {},
  },
  badges: [
    {
      name: String,
      earned_on: String,
    },
  ],
});

const User = mongoose.model('User', userSchema);

export default User;
