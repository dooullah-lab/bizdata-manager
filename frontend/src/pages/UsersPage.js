import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const ROLES = ['admin','manager','viewer'];

const UserModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    password: '', role: user?.role || 'viewer', status: user?.status || 'active',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required.'); return; }
    if (!user?.id && !form.password) { toast.error('Password is required for new users.'); return; }
    if (form.password && form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, role: form.role, status: form.status };
      if (!user?.id) payload.password = form.password;
      if (user?.id) {
        await api.put(`/users/${user.id}`, payload);
        toast.success('User updated.');
      } else {
        await api.post('/users', { ...payload, password: form.password });
        toast.success('User created.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{user?.id ? 'Edit User' : 'New User'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Full name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" />
          </div>
          <div className="form-group"><label className="form-label">Email address *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
          </div>
          {!user?.id && (
            <div className="form-group"><label className="form-label">Password *</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 characters" />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            {user?.id && (
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Role permissions:</strong><br />
            <strong>Admin</strong> — full access including user management &amp; audit logs.<br />
            <strong>Manager</strong> — create/edit records, view users.<br />
            <strong>Viewer</strong> — read-only access to records.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : (user?.id ? 'Save changes' : 'Create user')}</button>
        </div>
      </div>
    </div>
  );
};

const ResetPwdModal = ({ user, onClose }) => {
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const handleReset = async () => {
    if (pwd.length < 8) { toast.error('Min. 8 characters.'); return; }
    setSaving(true);
    try {
      await api.put(`/users/${user.id}/reset-password`, { newPassword: pwd });
      toast.success('Password reset successfully.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed.');
    } finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header"><h3>Reset Password — {user.name}</h3>
          <button className="btn-icon" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">New password</label>
            <input className="form-input" type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Min. 8 characters" autoFocus />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleReset} disabled={saving}>{saving ? 'Resetting…' : 'Reset password'}</button>
        </div>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [resetModal, setResetModal] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.users);
    } catch (err) { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('User deactivated.');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Control who has access and what they can do</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add user
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th>Joined</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.status === 'inactive' ? 0.6 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 30, height: 30, background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: 'var(--accent)', flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}{u.id === me?.id && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>(you)</span>}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{u.last_login ? format(new Date(u.last_login), 'MMM d, yyyy HH:mm') : 'Never'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-icon" title="Edit" onClick={() => setModal(u)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="btn-icon" title="Reset password" onClick={() => setResetModal(u)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </button>
                        {u.id !== me?.id && u.status === 'active' && (
                          <button className="btn-icon" title="Deactivate" onClick={() => handleDeactivate(u)} style={{ color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && <UserModal user={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchUsers(); }} />}
      {resetModal && <ResetPwdModal user={resetModal} onClose={() => { setResetModal(null); fetchUsers(); }} />}
    </div>
  );
}
