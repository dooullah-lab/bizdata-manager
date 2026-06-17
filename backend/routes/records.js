const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { authenticate, requireRole, auditLog } = require('../middleware/auth');

router.use(authenticate);

// GET /api/records — list with filter, search, pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    if (search) {
      where.push('(r.title LIKE ? OR r.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) { where.push('r.category = ?'); params.push(category); }
    if (status)   { where.push('r.status = ?');   params.push(status); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM business_records r ${whereClause}`, params
    );

    const [rows] = await pool.execute(
      `SELECT r.*, u.name as created_by_name
       FROM business_records r
       LEFT JOIN users u ON r.created_by = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      records: rows,
      pagination: {
        total: countRows[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countRows[0].total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch records.' });
  }
});

// GET /api/records/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [[total]]    = await pool.execute('SELECT COUNT(*) as count FROM business_records');
    const [[active]]   = await pool.execute("SELECT COUNT(*) as count FROM business_records WHERE status='active'");
    const [[pending]]  = await pool.execute("SELECT COUNT(*) as count FROM business_records WHERE status='pending'");
    const [[archived]] = await pool.execute("SELECT COUNT(*) as count FROM business_records WHERE status='archived'");
    const [[value]]    = await pool.execute('SELECT SUM(value) as total FROM business_records WHERE status="active"');

    const [categories] = await pool.execute(
      `SELECT category, COUNT(*) as count FROM business_records GROUP BY category ORDER BY count DESC LIMIT 5`
    );

    const [recent] = await pool.execute(
      `SELECT r.id, r.title, r.category, r.status, r.created_at, u.name as created_by_name
       FROM business_records r LEFT JOIN users u ON r.created_by = u.id
       ORDER BY r.created_at DESC LIMIT 5`
    );

    res.json({
      stats: { total: total.count, active: active.count, pending: pending.count, archived: archived.count, totalValue: value.total || 0 },
      categories,
      recentRecords: recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
});

// GET /api/records/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name as created_by_name
       FROM business_records r LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found.' });
    res.json({ record: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch record.' });
  }
});

// POST /api/records
router.post('/', requireRole('admin', 'manager'), auditLog('CREATE_RECORD', 'records'), async (req, res) => {
  try {
    const { title, category, description, value, status, tags } = req.body;
    if (!title || !category) return res.status(400).json({ message: 'Title and category are required.' });

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO business_records (id, title, category, description, value, status, tags, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title.trim(), category.trim(), description || null, value || null,
       status || 'active', tags ? JSON.stringify(tags) : null, req.user.id]
    );

    res.status(201).json({ message: 'Record created.', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create record.' });
  }
});

// PUT /api/records/:id
router.put('/:id', requireRole('admin', 'manager'), auditLog('UPDATE_RECORD', 'records'), async (req, res) => {
  try {
    const { title, category, description, value, status, tags } = req.body;
    await pool.execute(
      `UPDATE business_records
       SET title=?, category=?, description=?, value=?, status=?, tags=?, updated_by=?
       WHERE id=?`,
      [title.trim(), category.trim(), description || null, value || null,
       status, tags ? JSON.stringify(tags) : null, req.user.id, req.params.id]
    );
    res.json({ message: 'Record updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update record.' });
  }
});

// DELETE /api/records/:id (admin only)
router.delete('/:id', requireRole('admin'), auditLog('DELETE_RECORD', 'records'), async (req, res) => {
  try {
    await pool.execute('DELETE FROM business_records WHERE id=?', [req.params.id]);
    res.json({ message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete record.' });
  }
});

module.exports = router;
