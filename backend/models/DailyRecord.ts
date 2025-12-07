// backend/models/DailyRecord.ts
import mongoose from 'mongoose';

// Define task schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,   // Removes leading/trailing spaces
  },
  description: {
    type: String,
    trim: true,   // Optional short note or details
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

// Define daily record schema
const dailyRecordSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  total_tasks: {
    type: Number,
    default: 0,
  },
  completed_tasks: {
    type: Number,
    default: 0,
  },
  points_earned: {
    type: Number,
    default: 0,
  },
  completion_rate: {
    type: Number,
    default: 0,
  },
  tasks: [taskSchema], // Use the embedded schema here
  locked: {
    type: Boolean,
    default: false,
  },
  // 🛑 NEW FIELD FOR SOFT DELETE 🛑
  isDeleted: {
    type: Boolean,
    default: false,
  }
});

// Ensure each user has only one record per date
dailyRecordSchema.index({ user_id: 1, date: 1 }, { unique: true });

const DailyRecord = mongoose.model('DailyRecord', dailyRecordSchema);
export default DailyRecord;