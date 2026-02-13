const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all savings goals for user
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json({ savings: rows });
  } catch (err) {
    console.error('Get savings error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Create savings goal
router.post('/', async (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline } = req.body;
    if (!name || !target_amount) {
      return res.status(400).json({ error: { message: 'name and target_amount are required' } });
    }

    const [result] = await db.query(
      'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
      [req.userId, name, target_amount, current_amount || 0, deadline || null]
    );

    const [newRow] = await db.query('SELECT * FROM savings_goals WHERE id = ?', [result.insertId]);
    res.status(201).json({ saving: newRow[0] });
  } catch (err) {
    console.error('Create savings error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Update savings goal
router.put('/:id', async (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline } = req.body;
    const [result] = await db.query(
      'UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?, deadline = ? WHERE id = ? AND user_id = ?',
      [name, target_amount, current_amount, deadline || null, req.params.id, req.userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: { message: 'Savings goal not found' } });
    const [rows] = await db.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    res.json({ saving: rows[0] });
  } catch (err) {
    console.error('Update savings error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Add amount to savings goal
router.post('/:id/add', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: { message: 'amount is required and must be positive' } });
    }

    // Get current savings
    const [rows] = await db.query('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: { message: 'Savings goal not found' } });
    }

    const saving = rows[0];
    const newAmount = Number(saving.current_amount) + Number(amount);

    await db.query(
      'UPDATE savings_goals SET current_amount = ? WHERE id = ? AND user_id = ?',
      [newAmount, req.params.id, req.userId]
    );

    // Get updated savings
    const [updatedRows] = await db.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    res.json({ saving: updatedRows[0] });
  } catch (err) {
    console.error('Add to savings error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Delete savings goal
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: { message: 'Savings goal not found' } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete savings error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

module.exports = router;
