import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #eef2f9 0%, #dde6f3 100%)', padding: '20px' }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,42,77,0.07) 1px, transparent 0)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img src="/logo.png" alt="ImExTek Global Ltd" style={{ height: 64, margin: '0 auto 18px', display: 'block' }} />
          <p style={{ color: '#5b6b85', fontSize: '13px', marginTop: '4px' }}>Secure business data platform</p>
        </div>

        {/* Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e3e8f0', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: '0 12px 40px rgba(15,42,77,0.12)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '24px', color: '#15233d' }}>Sign in to your account</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#5b6b85' }}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                autoFocus
                style={{ background: '#f7f9fc', border: '1px solid #d8dfeb', borderRadius: 'var(--radius-sm)', color: '#15233d', fontFamily: 'inherit', fontSize: '14px', padding: '10px 14px', width: '100%', outline: 'none' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#5b6b85' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  style={{ background: '#f7f9fc', border: '1px solid #d8dfeb', borderRadius: 'var(--radius-sm)', color: '#15233d', fontFamily: 'inherit', fontSize: '14px', padding: '10px 14px', paddingRight: '42px', width: '100%', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8a96ab', cursor: 'pointer', display: 'flex', padding: '2px' }}
                >
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: '#c0392b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#7a87a0', fontSize: '12px', marginTop: '20px' }}>
          Contact your administrator to create or reset your account.
        </p>
      </div>
    </div>
  );
}
