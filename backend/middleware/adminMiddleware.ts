// backend/middleware/adminMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
  user_id?: string;
  isAdmin?: boolean;
}

/**
 * Admin middleware that verifies:
 * 1. User has a valid JWT token
 * 2. User exists in database
 * 3. User has admin privileges (username === "admin" OR isAdmin === true)
 */
export const adminMiddleware = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  // 1. Check for token
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.status(401).json({ msg: 'No token, authorization denied' });
    return;
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;
    
    const userId = decoded.user?.id || decoded.user_id;
    if (!userId) {
      res.status(401).json({ msg: 'Token is not valid (user ID missing)' });
      return;
    }

    // 3. Check if user exists and is admin
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      res.status(401).json({ msg: 'User not found' });
      return;
    }

    // Check admin status: username === "admin" OR isAdmin === true
    const isAdmin = user.username === "admin" || user.isAdmin === true;
    if (!isAdmin) {
      res.status(403).json({ msg: 'Admin access required' });
      return;
    }

    // User is authenticated and is an admin - proceed
    req.user_id = userId;
    req.isAdmin = true;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};