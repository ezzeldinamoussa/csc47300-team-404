// backend/routes/userRoutes.ts
import express from 'express';
import User from '../models/User';
import DailyRecord from '../models/DailyRecord';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = express.Router();

// 1. Get All Users (Admin only)
router.get('/', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 2. Ban/Unban User (Manual Toggle) - Admin only
router.post('/:id/ban', adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        user.isBanned = !user.isBanned; // Toggle true/false
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 3. Warn User with auto ban - Admin only
router.post('/:id/warn', adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        // 1. Increment the warning count
        user.warnCount = (user.warnCount || 0) + 1;

        // 2. Check if they hit the limit (5 warnings)
        if (user.warnCount >= 5) {
            user.isBanned = true; // Auto-ban
        }

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 4. Delete User - Admin only
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        // 1. Find the user to get their user_id before deletion
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const userIdToDelete = user.user_id; // Get the user_id (the foreign key)

        // 2. Delete the user from the User collection
        await User.findByIdAndDelete(req.params.id);
        
        // 🛑 3. DELETE ASSOCIATED DAILY RECORDS 🛑
        // Use deleteMany to remove all records linked to this user_id
        const deleteResult = await DailyRecord.deleteMany({ user_id: userIdToDelete });
        
        console.log(`Deleted ${deleteResult.deletedCount} daily records for user ${userIdToDelete}.`);

        res.json({ msg: 'User and all associated data deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;