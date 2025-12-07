// backend/routes/adminRoutes.ts
import express, { Router, Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import User from '../models/User'; 

const router: Router = express.Router();

// --- Helper Interfaces for TypeScript ---
interface AuthRequest extends Request {
  user_id?: string;
  adminLevel?: number; // Added to carry the admin level
}

interface CustomJwtPayload extends JwtPayload {
  user?: { id: string; adminLevel: number };
}

// --- Auth Middleware (Modified to get Admin Level) ---
export const adminAuthMiddleware = (requiredLevel: number) => (req: AuthRequest, res: Response, next: NextFunction) => {
// 🛑 NEW EXPORT: The middleware is exported to be used in userRoutes.ts 🛑
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as CustomJwtPayload;
    
    const level = decoded.user?.adminLevel || 0; // Get level from token
    
    if (level < requiredLevel) {
        return res.status(403).json({ msg: 'Forbidden: Insufficient admin privilege.' });
    }

    req.user_id = decoded.user?.id;
    req.adminLevel = level;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// ----------------------------------------------------------------------
// --- NEW SEGREGATED DATA ROUTES (Admin 1+ access) ---
// ----------------------------------------------------------------------

// 1. Get Current Standard Users
router.get('/data/current-users', adminAuthMiddleware(1), async (req: Request, res: Response) => {
    try {
        const users = await User.find({ isDeleted: false, adminLevel: 0 }).select('-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 2. Get Deleted Standard Users
router.get('/data/deleted-users', adminAuthMiddleware(1), async (req: Request, res: Response) => {
    try {
        const users = await User.find({ isDeleted: true, adminLevel: 0 }).select('-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 3. Get Current Admins (Level 1 and 2)
router.get('/data/current-admins', adminAuthMiddleware(1), async (req: Request, res: Response) => {
    try {
        // Find users who are NOT deleted AND have adminLevel > 0
        const users = await User.find({ isDeleted: false, adminLevel: { $gt: 0 } }).select('-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 4. Get Deleted Admins (Level 1 and 2)
// NOTE: Ideally, viewing deleted Admins should be restricted to Admin 2.
router.get('/data/deleted-admins', adminAuthMiddleware(2), async (req: Request, res: Response) => {
    try {
        // Find users who ARE deleted AND have adminLevel > 0
        const users = await User.find({ isDeleted: true, adminLevel: { $gt: 0 } }).select('-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ----------------------------------------------------------------------
// --- Admin 2 Feature: Create New Admin User (No change) ---
// ----------------------------------------------------------------------
router.post('/create-admin', adminAuthMiddleware(2), async (req: Request, res: Response) => {
  const { username, email, password, adminLevel } = req.body;
// ... (rest of the create-admin logic remains the same)
  // 1. Basic Validation
  if (!username || !email || !password || adminLevel === undefined || adminLevel === null) {
    return res.status(400).json({ msg: 'Please provide username, email, password, and admin level.' });
  }

  // Ensure the requested level is valid
  if (adminLevel !== 1 && adminLevel !== 2) {
      return res.status(400).json({ msg: 'Invalid admin level requested. Must be 1 or 2.' });
  }

  try {
    // 2. Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User with this email or username already exists.' });
    }

    // 3. Create new user object with admin fields
    user = new User({
      user_id: uuidv4(), 
      username,
      email,
      password_hash: password, 
      join_date: new Date().toISOString(),
      isAdmin: true, 
      adminLevel: adminLevel, // Set the specified level (1 or 2)
    });

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);

    // 5. Save user to database
    await user.save();

    res.status(201).json({ 
        msg: `Admin user created successfully with level ${adminLevel}.`, 
        id: user._id, 
        username: user.username,
        adminLevel: user.adminLevel
    });

  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;