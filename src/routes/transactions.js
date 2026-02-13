const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [req.userId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [transactions] = await db.query(query, params);
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const [transactions] = await db.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: { message: 'Transaction not found' } });
    }

    res.json({ transaction: transactions[0] });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    // Validate input
    if (!type || !amount || !category || !date) {
      return res.status(400).json({ 
        error: { message: 'Type, amount, category, and date are required' } 
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        error: { message: 'Type must be either income or expense' } 
      });
    }

    const [result] = await db.query(
      'INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, type, amount, category, description || null, date]
    );

    const [newTransaction] = await db.query(
      'SELECT * FROM transactions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ transaction: newTransaction[0] });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    // Check if transaction exists and belongs to user
    const [existing] = await db.query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: { message: 'Transaction not found' } });
    }

    await db.query(
      'UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?',
      [type, amount, category, description, date, req.params.id]
    );

    const [updatedTransaction] = await db.query(
      'SELECT * FROM transactions WHERE id = ?',
      [req.params.id]
    );

    res.json({ transaction: updatedTransaction[0] });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Transaction not found' } });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
});

module.exports = router;
