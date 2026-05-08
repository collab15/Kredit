import { useEffect, useState } from 'react';
import { Plus, CheckCircle, Trash2, Handshake } from 'lucide-react';
import toast from 'react-hot-toast';
import { favoursApi, usersApi } from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const EMPTY_FAVOUR   = { requestor_id: '', requestee_id: '', description: '' };
const EMPTY_COMPLETE = { favour_id: '', review: '' };

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function Favours() {
  const [favours,      setFavours]      = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('all');
  const [showCreate,   setShowCreate]   = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [form,         setForm]         = useState(EMPTY_FAVOUR);
  const [completion,   setCompletion]   = useState(EMPTY_COMPLETE);
  const [submitting,   setSubmitting]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([favoursApi.getAll(), usersApi.getAll()])
      .then(([f, u]) => { setFavours(f.data); setUsers(u.data); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = tab === 'all'
    ? favours
    : favours.filter(f => f.status === tab);

  const counts = {
    all:       favours.length,
    pending:   favours.filter(f => f.status === 'pending').length,
    completed: favours.filter(f => f.status === 'completed').length,
    open:      favours.filter(f => f.status === 'open').length,
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await favoursApi.create(form);
      toast.success('Favour created!');
      setShowCreate(false);
      setForm(EMPTY_FAVOUR);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await favoursApi.complete(completion.favour_id, { review: completion.review });
      toast.success('Favour marked as completed!');
      setShowComplete(false);
      setCompletion(EMPTY_COMPLETE);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this favour?')) return;
    try {
      await favoursApi.remove(id);
      toast.success('Favour deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openComplete = (favour) => {
    setCompletion({ favour_id: favour.favour_id, review: '' });
    setShowComplete(true);
  };

  const STATUS_STYLE = {
    completed: 'bg-kred/10 text-kred',
    pending:   'bg-warn/10 text-warn',
    open:      'bg-muted/10 text-muted',
  };

  const columns = [
    { key: 'requestor',    label: 'Requestor',   render: (r) => (
      <span className="font-mono text-white">{r.requestor}</span>
    )},
    { key: 'requestee',    label: 'Requestee',   render: (r) => (
      <span className="font-mono text-slate-300">{r.requestee}</span>
    )},
    { key: 'description',  label: 'Description', render: (r) =>
      r.description
        ? <span className="text-slate-400 text-xs">{r.description}</span>
        : <span className="text-muted">—</span>
    },
    { key: 'status',       label: 'Status',      render: (r) => (
      <span className={`k-badge ${STATUS_STYLE[r.status] || ''}`}>{r.status}</span>
    )},
    { key: 'done_at',      label: 'Completed',   render: (r) =>
      r.done_at
        ? <span className="text-xs text-muted">{fmtDate(r.done_at)}</span>
        : <span className="text-muted">—</span>
    },
    { key: 'review',       label: 'Review',      render: (r) =>
      r.review
        ? <span className="text-xs text-slate-400 italic">"{r.review}"</span>
        : <span className="text-muted">—</span>
    },
    { key: 'actions',      label: '',            render: (r) => (
      <div className="flex items-center gap-2">
        {r.status === 'pending' && (
          <button
            onClick={() => openComplete(r)}
            className="p-1.5 rounded text-muted hover:text-kred hover:bg-kred/10 transition-all"
            title="Mark complete"
          >
            <CheckCircle size={13} />
          </button>
        )}
        <button
          onClick={() => handleDelete(r.favour_id)}
          className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-all"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    )},
  ];

  const TABS = [
    { key: 'all',       label: 'All'       },
    { key: 'pending',   label: 'Pending'   },
    { key: 'completed', label: 'Completed' },
    { key: 'open',      label: 'Open'      },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-white">Favours</h1>
          <p className="text-muted text-sm mt-1">{favours.length} total favours</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="k-btn-primary flex items-center gap-2">
          <Plus size={14} /> New Favour
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',   count: counts.pending,   color: 'text-warn',   bg: 'bg-warn/10'  },
          { label: 'Completed', count: counts.completed, color: 'text-kred',   bg: 'bg-kred/10'  },
          { label: 'Open',      count: counts.open,      color: 'text-muted',  bg: 'bg-muted/10' },
        ].map(s => (
          <div key={s.label} className="k-card p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Handshake size={15} className={s.color} />
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest">{s.label}</p>
              <p className={`font-mono text-xl font-bold ${s.color} mt-0.5`}>{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bdr">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm transition-all relative ${
              tab === t.key ? 'text-accent font-medium' : 'text-muted hover:text-slate-300'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded ${
              tab === t.key ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'
            }`}>
              {counts[t.key]}
            </span>
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-px bg-accent" />}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="k-card">
        <DataTable columns={columns} data={filtered} loading={loading} emptyText="No favours in this category." />
      </div>

      {/* Create Favour Modal */}
      {showCreate && (
        <Modal title="Create New Favour" onClose={() => { setShowCreate(false); setForm(EMPTY_FAVOUR); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="k-label">Requestor (who needs the favour) <span className="text-danger">*</span></label>
              <select
                className="k-input"
                required
                value={form.requestor_id}
                onChange={e => setForm(p => ({ ...p, requestor_id: e.target.value }))}
              >
                <option value="">Select user…</option>
                {users.map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}
              </select>
            </div>

            <div>
              <label className="k-label">Requestee (who will do it) <span className="text-danger">*</span></label>
              <select
                className="k-input"
                required
                value={form.requestee_id}
                onChange={e => setForm(p => ({ ...p, requestee_id: e.target.value }))}
              >
                <option value="">Select user…</option>
                {users
                  .filter(u => u.user_id !== form.requestor_id)
                  .map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)
                }
              </select>
            </div>

            <div>
              <label className="k-label">Description</label>
              <textarea
                className="k-input resize-none h-20"
                placeholder="Help me move furniture this weekend…"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Favour'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Favour Modal */}
      {showComplete && (
        <Modal title="Complete Favour" onClose={() => { setShowComplete(false); setCompletion(EMPTY_COMPLETE); }}>
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="p-3 rounded-lg bg-kred/5 border border-kred/20 text-sm text-slate-300">
              Mark this favour as done. Optionally leave a review.
            </div>

            <div>
              <label className="k-label">Review (optional)</label>
              <textarea
                className="k-input resize-none h-20"
                placeholder="Great help, would request again…"
                value={completion.review}
                onChange={e => setCompletion(p => ({ ...p, review: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowComplete(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary flex items-center gap-2" disabled={submitting}>
                <CheckCircle size={13} /> {submitting ? 'Completing…' : 'Mark Complete'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}