import express, { Router, Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import DailyRecord from '../models/DailyRecord'; // Assuming this is your Mongoose model

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
    
    // Handle both payload structures (from auth.ts and original js)
    req.user_id = decoded.user?.id || decoded.user_id;

    if (!req.user_id) {
        return res.status(401).json({ msg: 'Token is not valid (user ID missing)' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- Get Daily Record ---
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    let record = await DailyRecord.findOne({ user_id: req.user_id, date: date as string });
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

    let record = await DailyRecord.findOne({ user_id: req.user_id, date });
    if (!record) record = new DailyRecord({ user_id: req.user_id, date, tasks: [] });

    record.tasks.push({ title, difficulty: difficulty || 'Medium', completed: false });
    record.total_tasks = record.tasks.length;
    await record.save();

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

    const record = await DailyRecord.findOne({ user_id: req.user_id, date: date as string });
    res.json(record?.tasks || []);
  } catch (err: any) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Get All Tasks ---
router.get('/getAllTasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await DailyRecord.find({ user_id: req.user_id });
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

    const record = await DailyRecord.findOne({ user_id: req.user_id, date });
    if (!record) return res.status(404).json({ msg: 'Daily record not found' });

    const task = record.tasks.id(taskId);
    if (!task) return res.status(404).json({ msg: 'Task not found or missing _id' });

    task.completed = completed;
    record.completed_tasks = record.tasks.filter(t => t.completed).length;
    record.completion_rate = record.total_tasks ? (record.completed_tasks / record.total_tasks) * 100 : 0;

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

    const record = await DailyRecord.findOne({ user_id: req.user_id, date });
    if (!record) return res.status(404).json({ msg: 'Daily record not found' });

    // First, check if the task exists
    const task = record.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found or already deleted' });
    }

    // Use .pull() to remove the subdocument from the DocumentArray
    // Pass the taskId, and Mongoose will find and remove it.
    record.tasks.pull(taskId);

    // Recalculate stats
    record.total_tasks = record.tasks.length;
    record.completed_tasks = record.tasks.filter(t => t.completed).length;
    record.completion_rate = record.total_tasks ? (record.completed_tasks / record.total_tasks) * 100 : 0;

    await record.save();
    res.json({ msg: 'Task deleted successfully', tasks: record.tasks });
  } catch (err: any) {
    console.error('Error deleting task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;