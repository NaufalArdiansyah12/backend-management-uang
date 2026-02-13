const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all debts for user
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM debts WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json({ debts: rows });
  } catch (err) {
    console.error('Get debts error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Create debt/receivable
router.post('/', async (req, res) => {
  try {
    const { type, person_name, amount, due_date, description } = req.body;
    if (!type || !person_name || !amount) {
      return res.status(400).json({ error: { message: 'type, person_name and amount are required' } });
    }

    const [result] = await db.query(
      'INSERT INTO debts (user_id, type, person_name, amount, remaining_amount, description, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, type, person_name, amount, amount, description || null, due_date || null]
    );

    const [newRow] = await db.query('SELECT * FROM debts WHERE id = ?', [result.insertId]);
    res.status(201).json({ debt: newRow[0] });
  } catch (err) {
    console.error('Create debt error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Update debt
router.put('/:id', async (req, res) => {
  try {
    const { type, person_name, amount, remaining_amount, due_date, description, status } = req.body;
    const [result] = await db.query(
      'UPDATE debts SET type = ?, person_name = ?, amount = ?, remaining_amount = ?, due_date = ?, description = ?, status = ? WHERE id = ? AND user_id = ?',
      [type, person_name, amount, remaining_amount, due_date || null, description || null, status || 'active', req.params.id, req.userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: { message: 'Debt not found' } });
    const [rows] = await db.query('SELECT * FROM debts WHERE id = ?', [req.params.id]);
    res.json({ debt: rows[0] });
  } catch (err) {
    console.error('Update debt error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Payment for debt/receivable
router.post('/:id/payment', async (req, res) => {
  try {
    const { payment_amount } = req.body;
    if (!payment_amount || payment_amount <= 0) {
      return res.status(400).json({ error: { message: 'payment_amount is required and must be positive' } });
    }

    // Get current debt
    const [rows] = await db.query('SELECT * FROM debts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: { message: 'Debt not found' } });
    }

    const debt = rows[0];
    if (payment_amount > debt.remaining_amount) {
      return res.status(400).json({ error: { message: 'Payment amount exceeds remaining amount' } });
    }

    // Update remaining amount
    const newRemaining = debt.remaining_amount - payment_amount;
    const newStatus = newRemaining === 0 ? 'paid' : 'active';

    await db.query(
      'UPDATE debts SET remaining_amount = ?, status = ? WHERE id = ? AND user_id = ?',
      [newRemaining, newStatus, req.params.id, req.userId]
    );

    // Get updated debt
    const [updatedRows] = await db.query('SELECT * FROM debts WHERE id = ?', [req.params.id]);
    res.json({ debt: updatedRows[0] });
  } catch (err) {
    console.error('Payment debt error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

// Delete debt
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM debts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: { message: 'Debt not found' } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete debt error:', err);
    res.status(500).json({ error: { message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message } });
  }
});

module.exports = router;
