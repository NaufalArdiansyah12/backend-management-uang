const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const ALLOWED_PERIODS = ['weekly', 'monthly', 'yearly'];

// All routes require authentication
router.use(authMiddleware);

// Get all budgets
router.get('/', async (req, res) => {
  try {
    const [budgets] = await db.query(
      'SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message } });
  }
});

// Create budget
router.post('/', async (req, res) => {
  try {
    const { category, amount, period } = req.body;

    if (!category || !amount || !period) {
      return res.status(400).json({ 
        error: { message: 'Category, amount, and period are required' } 
      });
    }

    if (!ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ error: { message: 'Invalid period value' } });
    }

    const [result] = await db.query(
      'INSERT INTO budgets (user_id, category, amount, period) VALUES (?, ?, ?, ?)',
      [req.userId, category, amount, period]
    );

    const [newBudget] = await db.query(
      'SELECT * FROM budgets WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ budget: newBudget[0] });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message } });
  }
});

// Update budget
router.put('/:id', async (req, res) => {
  try {
    const { category, amount, period } = req.body;

    if (!ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ error: { message: 'Invalid period value' } });
    }

    const [result] = await db.query(
      'UPDATE budgets SET category = ?, amount = ?, period = ? WHERE id = ? AND user_id = ?',
      [category, amount, period, req.params.id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Budget not found' } });
    }

    const [updatedBudget] = await db.query(
      'SELECT * FROM budgets WHERE id = ?',
      [req.params.id]
    );

    res.json({ budget: updatedBudget[0] });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message } });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Budget not found' } });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message } });
  }
});

module.exports = router;
