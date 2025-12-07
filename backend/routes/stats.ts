import express, { Router, Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';
import { processDailyRollover } from '../utils/dailyRollover';

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

// --- Helper Functions ---

/**
 * Convert daily_completion_summary Map to calendar heatmap format
 * Converts YYYY-MM-DD dates to Unix timestamps (in seconds) for Cal-Heatmap
 */
function convertToCalendarData(dailySummary: Map<string, number>): Record<string, number> {
  const calendarData: Record<string, number> = {};
  
  if (dailySummary && dailySummary.size > 0) {
    dailySummary.forEach((count, dateStr) => {
      // Convert YYYY-MM-DD to Unix timestamp (seconds, not milliseconds)
      // Cal-Heatmap expects Unix timestamps in seconds
      try {
        // Parse date as local date to avoid timezone offset issues
        // This ensures "2024-11-30" shows as Nov 30, not Nov 29
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
        const unixTimestamp = Math.floor(date.getTime() / 1000).toString();
        calendarData[unixTimestamp] = count;
      } catch (err) {
        console.warn(`Invalid date format in daily_completion_summary: ${dateStr}`);
      }
    });
  }
  
  return calendarData;
}

// --- Get User Stats ---
// @route   GET /api/stats
// @desc    Get user statistics (username, tasks, points, calendar data)
// @access  Private (requires authentication)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Process daily rollover on first API call of the day
    if (req.user_id) {
      await processDailyRollover(req.user_id);
    }

    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing from token' });
    }

    // Fetch user from database
    // 🛑 FILTER BY isDeleted: false 🛑
    const user = await User.findOne({ user_id: req.user_id, isDeleted: false });
    
    // Verify user exists (and wasn't soft-deleted)
    if (!user) {
      return res.status(404).json({ msg: 'User not found or account deactivated' });
    }

    // Calculate tasks_missed
    const tasksMissed = Math.max(0, user.total_tasks_created - user.total_tasks_completed);

    // Convert daily_completion_summary to calendar format
    const calendarData = convertToCalendarData(user.daily_completion_summary);

    // Return stats
    res.json({
      username: user.username,
      total_tasks_completed: user.total_tasks_completed,
      total_tasks_started: user.total_tasks_created,
      tasks_missed: tasksMissed,
      total_points: user.total_points,
      current_streak: user.current_streak || 0,
      highest_streak: user.highest_streak || 0,
      calendar_heatmap_data: calendarData
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;