const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

// GET /api/audit — paginated audit trail
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (user_id) { where.push('user_id = ?'); params.push(user_id); }
    if (action)  { where.push('action LIKE ?'); params.push(`%${action}%`); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params
    );

    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 50, 200));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    const [logs] = await pool.execute(
      `SELECT * FROM audit_logs ${whereClause}
       ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    res.json({ logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
