import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useAuth();
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChangePwd = async () => {
    if (!pwd.current || !pwd.new || !pwd.confirm) { toast.error('All fields are required.'); return; }
    if (pwd.new !== pwd.confirm) { toast.error('New passwords do not match.'); return; }
    if (pwd.new.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwd.current, newPassword: pwd.new });
      toast.success('Password changed successfully.');
      setPwd({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const roleDesc = { admin: 'Full system access — can manage users, view audit logs, and control all data.', manager: 'Can create and edit business records, and view user list.', viewer: 'Read-only access to business records.' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your account settings</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px' }}>
        {/* Account info */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Information</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), #818cf8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', color: '#fff' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Role', value: <span className={`badge badge-${user?.role}`}>{user?.role}</span> },
              { label: 'Account status', value: <span className="badge badge-active">Active</span> },
              { label: 'Last login', value: user?.last_login ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm') : 'This session' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Your permissions:</strong><br />
            {roleDesc[user?.role]}
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Change Password</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input className="form-input" type={showPwd ? 'text' : 'password'} value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input className="form-input" type={showPwd ? 'text' : 'password'} value={pwd.new} onChange={e => setPwd(p => ({ ...p, new: e.target.value }))} placeholder="Min. 8 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input className="form-input" type={showPwd ? 'text' : 'password'} value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              Show passwords
            </label>

            {pwd.new && pwd.confirm && pwd.new !== pwd.confirm && (
              <div className="form-error" style={{ fontSize: '13px' }}>Passwords do not match.</div>
            )}

            <button className="btn btn-primary" onClick={handleChangePwd} disabled={saving} style={{ marginTop: '4px' }}>
              {saving ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
