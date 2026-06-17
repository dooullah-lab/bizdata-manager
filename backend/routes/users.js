const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { authenticate, requireRole, auditLog } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// GET /api/users — list all users (admin + manager)
router.get('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, status, last_login, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// GET /api/users/:id
router.get('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, status, last_login, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
});

// POST /api/users — create user (admin only)
router.post('/', requireRole('admin'), auditLog('CREATE_USER', 'users'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const validRoles = ['admin', 'manager', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const id = uuidv4();
    const hashed = await bcrypt.hash(password, 12);

    await pool.execute(
      `INSERT INTO users (id, name, email, password, role, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [id, name.trim(), email.toLowerCase().trim(), hashed, role || 'viewer']
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: { id, name, email: email.toLowerCase(), role: role || 'viewer', status: 'active' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

// PUT /api/users/:id — update user (admin only)
router.put('/:id', requireRole('admin'), auditLog('UPDATE_USER', 'users'), async (req, res) => {
  try {
    const { name, email, role, status } = req.body;

    // Prevent removing the last admin
    if (status === 'inactive' || role !== 'admin') {
      const [adminCount] = await pool.execute(
        `SELECT COUNT(*) as count FROM users WHERE role='admin' AND status='active' AND id != ?`,
        [req.params.id]
      );
      const targetIsAdmin = await pool.execute(
        `SELECT role FROM users WHERE id = ?`, [req.params.id]
      );
      if (targetIsAdmin[0][0]?.role === 'admin' && adminCount[0].count === 0) {
        return res.status(400).json({ message: 'Cannot remove or demote the last active admin.' });
      }
    }

    await pool.execute(
      `UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?`,
      [name.trim(), email.toLowerCase().trim(), role, status, req.params.id]
    );

    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

// DELETE /api/users/:id — soft delete (admin only)
router.delete('/:id', requireRole('admin'), auditLog('DELETE_USER', 'users'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    await pool.execute(`UPDATE users SET status='inactive' WHERE id=?`, [req.params.id]);
    res.json({ message: 'User deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to deactivate user.' });
  }
});

// Admin reset password
router.put('/:id/reset-password', requireRole('admin'), auditLog('RESET_PASSWORD', 'users'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password=? WHERE id=?', [hashed, req.params.id]);
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password.' });
  }
});

module.exports = router;
