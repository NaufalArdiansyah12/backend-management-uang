const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Dev-only migration endpoint — only enabled when NODE_ENV !== 'production'
router.post('/apply-weekly-period', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: { message: 'Forbidden in production' } });
    }

    // Run the ALTER TABLE to add 'weekly' to the ENUM
    await db.query("ALTER TABLE budgets MODIFY period ENUM('weekly','monthly','yearly') NOT NULL;");

    res.json({ ok: true, message: "Applied migration: budgets.period updated" });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: { message: err.message } });
  }
});

module.exports = router;
