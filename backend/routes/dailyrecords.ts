import express, { Router, Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import DailyRecord from '../models/DailyRecord'; 
import User from '../models/User';
import { processDailyRollover, getTodayString, getTomorrowString } from '../utils/dailyRollover';

const router: Router = express.Router();

// --- Helper Interfaces for TypeScript ---

// Extend Express's Request to include the user_id from the middleware
interface AuthRequest extends Request {
  user_id?: string;
}

// Define the expected shape of our JWT payload
interface CustomJwtPayload extends JwtPayload {
  user?: { id: string };
  user_id?: string;
}

// --- Auth Middleware ---
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as CustomJwtPayload;
    
    req.user_id = decoded.user?.id || decoded.user_id;

    if (!req.user_id) {
        return res.status(401).json({ msg: 'Token is not valid (user ID missing)' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- Helper Functions ---

/**
 * Calculate points based on task difficulty
 * Easy = 5 points, Medium = 10 points, Hard = 20 points
 */
function calculatePoints(difficulty: string): number {
  const pointsMap: Record<string, number> = {
    'Easy': 5,
    'Medium': 10,
    'Hard': 20
  };
  return pointsMap[difficulty] || 10; 
}

// --- Get Daily Record ---
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user_id) {
      await processDailyRollover(req.user_id);
    }

    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    // 🛑 FILTER BY isDeleted: false 🛑
    let record = await DailyRecord.findOne({ 
        user_id: req.user_id, 
        date: date as string, 
        isDeleted: false 
    });
    
    if (!record) {
      record = new DailyRecord({ user_id: req.user_id, date, tasks: [] });
      await record.save();
    }

    res.json(record);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Add Task ---
router.post('/addTask', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, title, difficulty } = req.body;
    if (!date || !title) return res.status(400).json({ msg: 'Date and title required' });

    // 🛑 FILTER BY isDeleted: false 🛑
    let record = await DailyRecord.findOne({ user_id: req.user_id, date, isDeleted: false });
    if (!record) record = new DailyRecord({ user_id: req.user_id, date, tasks: [] });

    record.tasks.push({ title, difficulty: difficulty || 'Medium', completed: false });
    record.total_tasks = record.tasks.length;
    await record.save();

    // Update User total_tasks_created
    const user = await User.findOne({ user_id: req.user_id });
    if (user) {
      user.total_tasks_created += 1;
      await user.save();
    }

    res.json(record);
  } catch (err: any) {
    console.error('Error adding task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Get Specific Tasks Only ---
router.get('/getTasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    // 🛑 FILTER BY isDeleted: false 🛑
    const record = await DailyRecord.findOne({ user_id: req.user_id, date: date as string, isDeleted: false });
    res.json({ tasks: record?.tasks || [] });
  } catch (err: any) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Get All Tasks ---
router.get('/getAllTasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // 🛑 FILTER BY isDeleted: false 🛑
    const records = await DailyRecord.find({ user_id: req.user_id, isDeleted: false });
    return res.send(records);
  } catch (err: any) {
    console.error('Error fetching all tasks: ', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Update Task Completed Status ---
router.patch('/updateTask', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, taskId, completed } = req.body;
    if (!date || !taskId) return res.status(400).json({ msg: 'Date and taskId required' });

    // 🛑 FILTER BY isDeleted: false 🛑
    const record = await DailyRecord.findOne({ user_id: req.user_id, date, isDeleted: false });
    if (!record) return res.status(404).json({ msg: 'Daily record not found' });

    const task = record.tasks.id(taskId);
    if (!task) return res.status(404).json({ msg: 'Task not found or missing _id' });

// ... (Rest of the update logic remains the same) ...

    // Track previous completion status and calculate points
    const wasCompleted = task.completed;
    const points = calculatePoints(task.difficulty);

    // Update task completion status
    task.completed = completed;
    record.completed_tasks = record.tasks.filter(t => t.completed).length;
    record.completion_rate = record.total_tasks ? (record.completed_tasks / record.total_tasks) * 100 : 0;

    // Update points_earned for the day
    if (completed && !wasCompleted) {
      // Marking as complete - add points
      record.points_earned += points;
    } else if (!completed && wasCompleted) {
      // Unmarking as complete - subtract points
      record.points_earned = Math.max(0, record.points_earned - points);
    }

    // Update User model
    const user = await User.findOne({ user_id: req.user_id });
    if (user) {
      // Initialize daily_completion_summary if it doesn't exist
      if (!user.daily_completion_summary) {
        user.daily_completion_summary = new Map();
      }

      // Get current count for this date (default to 0 if doesn't exist)
      const currentCount = user.daily_completion_summary.get(date) || 0;

      if (completed && !wasCompleted) {
        // Marking as complete
        user.total_tasks_completed += 1;
        user.total_points += points;
        // Increment daily completion count for this date
        user.daily_completion_summary.set(date, currentCount + 1);
      } else if (!completed && wasCompleted) {
        // Unmarking as complete
        user.total_tasks_completed = Math.max(0, user.total_tasks_completed - 1);
        user.total_points = Math.max(0, user.total_points - points);
        // Decrement daily completion count for this date (but not below 0)
        user.daily_completion_summary.set(date, Math.max(0, currentCount - 1));
      }
      await user.save();
    }

    await record.save();
    res.json(record);
  } catch (err: any) {
    console.error('Error updating task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Delete Task ---
router.delete('/deleteTask', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, taskId } = req.body;
    if (!date || !taskId) return res.status(400).json({ msg: 'Date and taskId required' });

    // 🛑 FILTER BY isDeleted: false 🛑
    const record = await DailyRecord.findOne({ user_id: req.user_id, date, isDeleted: false });
    if (!record) return res.status(404).json({ msg: 'Daily record not found' });

// ... (Rest of the delete logic remains the same) ...

    // Check if record is locked (today's tasks cannot be deleted)
    if (record.locked) {
      return res.status(403).json({ msg: 'Cannot delete tasks from locked days' });
    }

    // Validate date is tomorrow (only tomorrow's tasks can be deleted)
    const today = getTodayString();
    const tomorrowStr = getTomorrowString();

    if (date !== tomorrowStr) {
      return res.status(403).json({ msg: 'Can only delete tomorrow\'s tasks' });
    }

    // First, check if the task exists
    const task = record.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found or already deleted' });
    }

    // Track task state before deletion
    const wasCompleted = task.completed;
    const taskDifficulty = task.difficulty;
    const points = calculatePoints(taskDifficulty);

    // Use .pull() to remove the subdocument from the DocumentArray
    record.tasks.pull(taskId);

    // Recalculate stats
    record.total_tasks = record.tasks.length;
    record.completed_tasks = record.tasks.filter(t => t.completed).length;
    record.completion_rate = record.total_tasks ? (record.completed_tasks / record.total_tasks) * 100 : 0;

    // Update points_earned if task was completed
    if (wasCompleted) {
      record.points_earned = Math.max(0, record.points_earned - points);
    }

    // Update User model
    const user = await User.findOne({ user_id: req.user_id });
    if (user) {
      user.total_tasks_created = Math.max(0, user.total_tasks_created - 1);
      if (wasCompleted) {
        user.total_tasks_completed = Math.max(0, user.total_tasks_completed - 1);
        user.total_points = Math.max(0, user.total_points - points);
      }
      await user.save();
    }

    await record.save();
    res.json({ msg: 'Task deleted successfully', tasks: record.tasks });
  } catch (err: any) {
    console.error('Error deleting task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;