import express, { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
  user_id?: string;
}

interface CustomJwtPayload extends JwtPayload {
  user?: { id: string; username: string };
  user_id?: string;
}

// Auth Middleware (same pattern as other routes)
const authMiddleware = (req: AuthRequest, res: Response, next: any) => {
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

const router = express.Router();

// GET /api/friends/leaderboard
router.get('/leaderboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing' });
    }

    const currentUser = await User.findOne({ user_id: req.user_id });
    if (!currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const friendUsernames = currentUser.friends || [];
    const allUsernames = [currentUser.username, ...friendUsernames];

    const users = await User.find({
      username: { $in: allUsernames }
    }).select('username total_points current_streak highest_streak isBanned isDeleted').sort({ total_points: -1 });

    res.json(users);
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/friends/search
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing' });
    }

    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ msg: 'Username required' });
    }

    const currentUser = await User.findOne({ user_id: req.user_id });
    if (!currentUser) {
      return res.status(404).json({ msg: 'Current user not found' });
    }

    if (username.toLowerCase() === currentUser.username.toLowerCase()) {
      return res.status(400).json({ msg: 'Cannot search for yourself' });
    }

    // 🛑 Projection updated to include isDeleted 🛑
    const targetUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    }).select('username isDeleted'); 

    if (!targetUser) {
      return res.json({ exists: false });
    }

    const friends = currentUser.friends || [];
    const friendRequests = currentUser.friendRequests || [];
    const sentRequests = await User.find({
      friendRequests: currentUser.username
    }).select('username');
    const sentRequestUsernames = sentRequests.map(u => u.username);

    const isFriend = friends.includes(targetUser.username);
    const hasIncomingRequest = friendRequests.includes(targetUser.username);
    const hasOutgoingRequest = sentRequestUsernames.includes(targetUser.username);

    res.json({
      exists: true,
      username: targetUser.username,
      isDeleted: targetUser.isDeleted || false, // Ensure flag is sent
      isFriend,
      hasIncomingRequest,
      hasOutgoingRequest,
      canSendRequest: !isFriend && !hasIncomingRequest && !hasOutgoingRequest
    });
  } catch (err: any) {
    console.error('Error searching user:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/friends/request
// Send friend request
router.post('/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ msg: 'Username required' });
    }

    const currentUser = await User.findOne({ user_id: req.user_id });
    if (!currentUser) {
      return res.status(404).json({ msg: 'Current user not found' });
    }

    if (currentUser.username === username) {
      return res.status(400).json({ msg: 'Cannot send request to yourself' });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentFriends = currentUser.friends || [];
    const currentRequests = currentUser.friendRequests || [];
    const targetFriends = targetUser.friends || [];
    const targetRequests = targetUser.friendRequests || [];

    // Check if already friends
    if (currentFriends.includes(username)) {
      return res.status(400).json({ msg: 'Already friends' });
    }

    // Check if request already exists (current user already sent request to target user)
    if (targetRequests.includes(currentUser.username)) {
      return res.status(400).json({ msg: 'Friend request already sent to this user' });
    }

    // Double-check: Verify target user doesn't already have a pending request from current user
    // This prevents race conditions
    const refreshedTargetUser = await User.findOne({ username });
    if (refreshedTargetUser && (refreshedTargetUser.friendRequests || []).includes(currentUser.username)) {
      return res.status(400).json({ msg: 'Friend request already sent to this user' });
    }

    // SPECIAL RULE: If target user has sent a request to current user, auto-accept
    if (currentRequests.includes(username)) {
      // Auto-accept: add each other to friends and remove from requests
      if (!currentFriends.includes(username)) {
        currentUser.friends = [...currentFriends, username];
      }
      currentUser.friendRequests = currentRequests.filter(u => u !== username);

      if (!targetFriends.includes(currentUser.username)) {
        targetUser.friends = [...targetFriends, currentUser.username];
      }
      targetUser.friendRequests = targetRequests.filter(u => u !== currentUser.username);

      await currentUser.save();
      await targetUser.save();

      return res.json({ msg: 'Friend request auto-accepted!', autoAccepted: true });
    }

    // Normal flow: add request to target user
    targetUser.friendRequests = [...targetRequests, currentUser.username];
    await targetUser.save();

    res.json({ msg: 'Friend request sent' });
  } catch (err: any) {
    console.error('Error sending friend request:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/friends/requests
// Get incoming friend requests
router.get('/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing' });
    }

    const currentUser = await User.findOne({ user_id: req.user_id });
    if (!currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const requests = currentUser.friendRequests || [];
    res.json(requests);
  } catch (err: any) {
    console.error('Error fetching friend requests:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/friends/accept
// Accept friend request
router.post('/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ msg: 'Username required' });
    }

    const currentUser = await User.findOne({ user_id: req.user_id });
    if (!currentUser) {
      return res.status(404).json({ msg: 'Current user not found' });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ msg: 'Target user not found' });
    }

    const currentFriends = currentUser.friends || [];
    const currentRequests = currentUser.friendRequests || [];
    const targetFriends = targetUser.friends || [];
    const targetRequests = targetUser.friendRequests || [];

    // Check if request exists
    if (!currentRequests.includes(username)) {
      return res.status(400).json({ msg: 'Friend request not found' });
    }

    // Remove from requests and add to friends (both users)
    currentUser.friends = [...currentFriends, username];
    currentUser.friendRequests = currentRequests.filter(u => u !== username);

    // Also remove current user's request from target user if it exists
    targetUser.friendRequests = targetRequests.filter(u => u !== currentUser.username);
    if (!targetFriends.includes(currentUser.username)) {
      targetUser.friends = [...targetFriends, currentUser.username];
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ msg: 'Friend request accepted' });
  } catch (err: any) {
    console.error('Error accepting friend request:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/friends/deny
// Deny friend request
router.post('/deny', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ msg: 'Username required' });
    }

    const currentUser = await User.findOne({ user_id: req.user_id });
    if (!currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentRequests = currentUser.friendRequests || [];

    if (!currentRequests.includes(username)) {
      return res.status(400).json({ msg: 'Friend request not found' });
    }

    currentUser.friendRequests = currentRequests.filter(u => u !== username);
    await currentUser.save();

    res.json({ msg: 'Friend request denied' });
  } catch (err: any) {
    console.error('Error denying friend request:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/friends/remove
// Remove friend
router.post('/remove', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user_id) {
      return res.status(401).json({ msg: 'User ID missing' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ msg: 'Username required' });
    }

    const currentUser = await User.findOne({ user_id: req.user_id });
    if (!currentUser) {
      return res.status(404).json({ msg: 'Current user not found' });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ msg: 'Target user not found' });
    }

    const currentFriends = currentUser.friends || [];
    const targetFriends = targetUser.friends || [];

    if (!currentFriends.includes(username)) {
      return res.status(400).json({ msg: 'Not friends' });
    }

    // Remove from both users' friends lists
    currentUser.friends = currentFriends.filter(u => u !== username);
    targetUser.friends = targetFriends.filter(u => u !== currentUser.username);

    await currentUser.save();
    await targetUser.save();

    res.json({ msg: 'Friend removed' });
  } catch (err: any) {
    console.error('Error removing friend:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;

