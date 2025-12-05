// backend/routes/userRoutes.ts
import express from 'express';
import User from '../models/User';

const router = express.Router();

// 1. Get All Users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 2. Ban/Unban User (Manual Toggle)
router.post('/:id/ban', async (req, res) => {
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

// 3. Warn User with auto ban
router.post('/:id/warn', async (req, res) => {
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

// 4. Delete User 
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ msg: 'User deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

export default router;