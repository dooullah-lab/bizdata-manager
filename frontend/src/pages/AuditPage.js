import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { format } from 'date-fns';

const actionColor = (a) => {
  if (a.includes('CREATE')) return 'var(--success)';
  if (a.includes('DELETE') || a.includes('DEACTIVATE')) return 'var(--danger)';
  if (a.includes('UPDATE') || a.includes('RESET') || a.includes('CHANGE')) return 'var(--warning)';
  if (a === 'LOGIN') return 'var(--info)';
  return 'var(--text-secondary)';
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/audit?page=${page}&limit=50`);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Complete trail of all system activity</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Read-only — all events are immutable
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <h4>No audit events yet</h4>
            <p>Events will appear here as users interact with the system.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th></tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{log.user_email || '—'}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: actionColor(log.action), fontWeight: 600 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{log.resource || '—'}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="pagination" style={{ padding: '12px 20px' }}>
                <span>{pagination.total} total events</span>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>Page {pagination.page} of {pagination.pages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
