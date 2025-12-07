// backend/routes/userRoutes.ts
import express, { Router, Request, Response } from 'express';
import User from '../models/User';
import DailyRecord from '../models/DailyRecord';
// 🛑 IMPORTS from Version 1 & 2 🛑
import { adminMiddleware } from '../middleware/adminMiddleware'; 
import { adminAuthMiddleware } from './adminRoutes'; // Assumes adminAuthMiddleware is exported from adminRoutes

const router: Router = express.Router();

// 1. Get All Users (List) - NOTE: This route is now mostly superseded by adminRoutes/data/...
// @access: Admin 1+
router.get('/', adminAuthMiddleware(1), async (req: Request, res: Response) => {
    try {
        // Version 2's filter logic: Only show non-deleted users
        const users = await User.find({ isDeleted: false }).select('-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 1b. Get User Details and History (for Dynamic Routing /admin/users/:userId)
// @access: Admin 1+
router.get('/:userId/details', adminAuthMiddleware(1), async (req: Request, res: Response) => {
    try {
        // Find the user by user_id (the external ID)
        const user = await User.findOne({ user_id: req.params.userId, isDeleted: false }).select('-password_hash');
        if (!user) return res.status(404).json({ msg: 'User not found.' });

        // Fetch their historical daily records (excluding soft-deleted ones)
        const history = await DailyRecord.find({ user_id: req.params.userId, isDeleted: false })
            .select('-tasks -__v') // Exclude heavy task list and version field
            .sort({ date: -1 }) // Sort by most recent first
            .limit(10); // Optionally limit the history length

        res.json({
            user,
            history
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).send('Server Error');
    }
});


// 2. Ban/Unban User (Manual Toggle)
// @access: Admin 1+ (Moderation task)
router.post('/:id/ban', adminAuthMiddleware(1), async (req: Request, res: Response) => {
    try {
        // Frontend now sends { isBanned: true/false }
        const { isBanned } = req.body;
        
        // We use findById here since the Admin is likely passing the Mongoose _id
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        // 🛑 Update: Use the value from the body to set the ban status
        user.isBanned = isBanned === true; 
        await user.save();

        const status = user.isBanned ? 'banned' : 'unbanned';
        res.json({ msg: `User successfully ${status}.`, user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 3. Warn User with auto ban
// @access: Admin 1+ (Moderation task)
router.post('/:id/warn', adminAuthMiddleware(1), async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        // 1. Increment the warning count
        user.warnCount = (user.warnCount || 0) + 1;
        let msg = `User warned. Count: ${user.warnCount}.`;

        // 2. Check if they hit the limit (5 warnings)
        if (user.warnCount >= 5) {
            user.isBanned = true; // Auto-ban
            msg += ' User reached 5 warnings and has been auto-banned.';
        }

        await user.save();
        res.json({ msg, user });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 4. Delete User (SOFT DELETE IMPLEMENTATION)
// @access: Admin 2 ONLY 
router.delete('/:id', adminAuthMiddleware(2), async (req: Request, res: Response) => {
    try {
        // 1. Find the user by Mongoose _id
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const userIdToDelete = user.user_id; 
        const isUserAdmin = user.adminLevel > 0;

        // 2. Perform SOFT DELETE on the User document
        user.isDeleted = true;
        // 🛑 Special Admin 2 logic: If deleting an Admin, demote them first
        if (isUserAdmin) {
            user.isAdmin = false;
            user.adminLevel = 0;
        }
        await user.save();
        
        // 3. Perform SOFT DELETE on ASSOCIATED DAILY RECORDS
        await DailyRecord.updateMany(
            { user_id: userIdToDelete },
            { $set: { isDeleted: true } }
        );
        
        const msg = isUserAdmin 
          ? 'Admin demoted and soft-deleted successfully.' 
          : 'User and all associated data soft-deleted successfully.';

        res.json({ msg });
    } catch (err) {
        console.error('Soft delete error:', err);
        res.status(500).send('Server Error');
    }
});


// 5. Restore User (REVERSE SOFT DELETE)
// @route POST /api/users/:id/restore
// @desc Reverses soft deletion for a user and their daily records
// @access Admin 2 ONLY (Only Admin 2 can view/restore deleted items)
router.post('/:id/restore', adminAuthMiddleware(2), async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found.' });

        const userIdToRestore = user.user_id;

        // 1. Reverse SOFT DELETE on the User document
        user.isDeleted = false;
        // Optionally, reset isBanned if they were deleted while banned
        user.isBanned = false; 
        
        // 2. If the user was an admin (adminLevel > 0) before deletion, restore their admin status
        // NOTE: The user was demoted to adminLevel=0 upon soft-deletion, so we can't reliably restore their old level here without more data.
        // For simplicity, we restore them as a standard user, and an Admin 2 can re-promote them if needed.
        
        await user.save();

        // 3. Reverse SOFT DELETE on ASSOCIATED DAILY RECORDS
        await DailyRecord.updateMany(
            { user_id: userIdToRestore },
            { $set: { isDeleted: false } }
        );

        res.json({ msg: 'User and associated data successfully restored.' });
    } catch (err) {
        console.error('Restore error:', err);
        res.status(500).send('Server Error');
    }
});


export default router;