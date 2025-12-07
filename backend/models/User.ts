import mongoose, { Document, Schema } from 'mongoose';

// 1. Define the Interface 
export interface IUser extends Document {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  join_date: string;
  timezone?: string;
  preferred_theme: string;
  total_points: number;
  current_streak: number;
  highest_streak: number;
  total_tasks_completed: number;
  total_tasks_created: number;
  average_tasks_per_day: number;
  daily_completion_summary: Map<string, number>;
  last_rollover_date: string | null;
  badges: { name: string; earned_on: string }[];
  
  //Admin Fields
  isAdmin?: boolean;
  isBanned?: boolean;
  warnCount?: number;
  // 🛑 NEW FIELDS FOR PROJECT REQUIREMENTS 🛑
  adminLevel: number; // 0=User, 1=Admin 1 (CRU), 2=Admin 2 (CRUD + Create Admin)
  isDeleted: boolean; // For soft deletion
}

// 2. Define the Schema 
const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
  total_tasks_created: {
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
  last_rollover_date: {
    type: String,
    default: null,
  },
  badges: [
    {
      name: String,
      earned_on: String,
    },
  ],

  //Admin Fields
  isAdmin: { 
    type: Boolean, 
    default: false 
  },
  isBanned: { 
    type: Boolean, 
    default: false 
  },
  warnCount: { 
    type: Number, 
    default: 0 
  },
  // 🛑 NEW FIELDS FOR PROJECT REQUIREMENTS 🛑
  adminLevel: {
    type: Number,
    default: 0, // Default 0 for regular users
  },
  isDeleted: {
    type: Boolean,
    default: false, // Default false for active users
  },
});

// 3. Export the Model with the Interface
const User = mongoose.model<IUser>('User', userSchema);

export default User;