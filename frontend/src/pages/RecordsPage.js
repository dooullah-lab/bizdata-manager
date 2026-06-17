import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const CATEGORIES = ['Finance','Operations','HR','Sales','Marketing','Legal','IT','Procurement','Other'];
const STATUSES   = ['active','pending','archived'];

const Badge = ({ s }) => <span className={`badge badge-${s}`}>{s}</span>;

const RecordModal = ({ record, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: record?.title || '',
    category: record?.category || '',
    description: record?.description || '',
    value: record?.value || '',
    status: record?.status || 'active',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.category) {
      toast.error('Title and category are required.'); return;
    }
    setSaving(true);
    try {
      if (record?.id) {
        await api.put(`/records/${record.id}`, form);
        toast.success('Record updated.');
      } else {
        await api.post('/records', form);
        toast.success('Record created.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{record?.id ? 'Edit Record' : 'New Record'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Record title" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Value ($)</label>
            <input className="form-input" type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : (record?.id ? 'Save changes' : 'Create record')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RecordsPage() {
  const { isManager, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', page: 1 });
  const [modal, setModal] = useState(null); // null | {} | record
  const [deleting, setDeleting] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)   params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.status)   params.set('status', filters.status);
      params.set('page', filters.page);
      params.set('limit', 20);
      const { data } = await api.get(`/records?${params}`);
      setRecords(data.records);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record permanently?')) return;
    setDeleting(id);
    try {
      await api.delete(`/records/${id}`);
      toast.success('Record deleted.');
      fetchRecords();
    } catch (err) {
      toast.error('Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Business Records</h1>
          <p className="page-subtitle">Manage and track all your business data</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setModal({})}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="form-input" placeholder="Search records…" value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filters.category}
          onChange={e => setFilters(p => ({ ...p, category: e.target.value, page: 1 }))}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filters.search || filters.category || filters.status) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', category: '', status: '', page: 1 })}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <h4>No records found</h4>
            <p>{filters.search || filters.category || filters.status ? 'Try adjusting your filters.' : 'Create your first record to get started.'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Created by</th>
                    <th>Date</th>
                    {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.title}</div>
                        {r.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
                      </td>
                      <td><span style={{ color: 'var(--text-secondary)' }}>{r.category}</span></td>
                      <td><Badge s={r.status} /></td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                        {r.value != null ? `$${Number(r.value).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{r.created_by_name || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{format(new Date(r.created_at), 'MMM d, yyyy')}</td>
                      {isManager && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button className="btn-icon" title="Edit" onClick={() => setModal(r)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            {isAdmin && (
                              <button className="btn-icon" title="Delete" disabled={deleting === r.id} onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination" style={{ padding: '12px 20px' }}>
                <span>{pagination.total} total records</span>
                <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
                <span>Page {pagination.page} of {pagination.pages}</span>
                <button className="btn btn-secondary btn-sm" disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {modal !== null && (
        <RecordModal
          record={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchRecords(); }}
        />
      )}
    </div>
  );
}
