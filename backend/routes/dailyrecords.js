const express = require('express');
const router = express.Router();
const DailyRecord = require('../models/DailyRecord');
const jwt = require('jsonwebtoken');

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user_id = decoded.user?.id || decoded.user_id;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- Get Daily Record ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    let record = await DailyRecord.findOne({ user_id: req.user_id, date });
    if (!record) {
      record = new DailyRecord({ user_id: req.user_id, date, tasks: [] });
      await record.save();
    }

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Add Task ---
router.post('/addTask', authMiddleware, async (req, res) => {
  try {
    const { date, title, difficulty } = req.body;
    if (!date || !title) return res.status(400).json({ msg: 'Date and title required' });

    let record = await DailyRecord.findOne({ user_id: req.user_id, date });
    if (!record) record = new DailyRecord({ user_id: req.user_id, date, tasks: [] });

    record.tasks.push({ title, difficulty: difficulty || 'Medium', completed: false });
    record.total_tasks = record.tasks.length;
    await record.save();

    res.json(record);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Get Tasks Only ---
router.get('/getTasks', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'Date required' });

    const record = await DailyRecord.findOne({ user_id: req.user_id, date });
    res.json(record?.tasks || []);
  } catch (err) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Update Task Completed Status ---
router.patch('/updateTask', authMiddleware, async (req, res) => {
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
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- Delete Task ---
router.delete('/deleteTask', authMiddleware, async (req, res) => {
  try {
    const { date, taskId } = req.body;
    if (!date || !taskId) return res.status(400).json({ msg: 'Date and taskId required' });

    const record = await DailyRecord.findOne({ user_id: req.user_id, date });
    if (!record) return res.status(404).json({ msg: 'Daily record not found' });

    const originalLength = record.tasks.length;
    record.tasks = record.tasks.filter(t => t._id.toString() !== taskId);
    if (record.tasks.length === originalLength) {
      return res.status(404).json({ msg: 'Task not found or already deleted' });
    }

    record.total_tasks = record.tasks.length;
    record.completed_tasks = record.tasks.filter(t => t.completed).length;
    record.completion_rate = record.total_tasks ? (record.completed_tasks / record.total_tasks) * 100 : 0;

    await record.save();
    res.json({ msg: 'Task deleted successfully', tasks: record.tasks });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
