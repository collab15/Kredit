import { useEffect, useState } from 'react';
import { Plus, CheckCircle, Trash2, Handshake, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { favoursApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import UserLookupInput from '../../components/UserLookupInput';

const EMPTY_FAVOUR   = { requestee_id: '', description: '', compensation: '' };
const EMPTY_COMPLETE = { favour_id: '', review: '' };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function UserFavours() {
  const { user }   = useAuth();
  const [favours,      setFavours]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('all');
  const [showCreate,   setShowCreate]   = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [requesteeUsername, setRequesteeUsername] = useState('');
  const [requesteeUser,     setRequesteeUser]     = useState(null);
  const [description,       setDescription]       = useState('');
  const [compensation,      setCompensation]      = useState('');
  const [completion,        setCompletion]        = useState(EMPTY_COMPLETE);
  const [submitting,        setSubmitting]        = useState(false);

  const load = () => {
    setLoading(true);
    favoursApi.getAll()
      .then(r => setFavours(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const TAB_FILTER = {
    all:       () => true,
    pending:   (f) => f.status === 'pending',
    completed: (f) => f.status === 'completed',
    open:      (f) => f.status === 'open',
    by_me:     (f) => f.requestor_id === user.id,
    for_me:    (f) => f.requestee_id === user.id,
  };
  const filtered = favours.filter(TAB_FILTER[tab] || (() => true));
  const counts   = {
    all:       favours.length,
    pending:   favours.filter(f => f.status === 'pending').length,
    completed: favours.filter(f => f.status === 'completed').length,
    open:      favours.filter(f => f.status === 'open').length,
    by_me:     favours.filter(f => f.requestor_id === user.id).length,
    for_me:    favours.filter(f => f.requestee_id === user.id).length,
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!requesteeUser) { toast.error('Please enter a valid username'); return; }
    setSubmitting(true);
    try {
      await favoursApi.create({ requestor_id: user.id, requestee_id: requesteeUser.user_id, description, compensation: parseFloat(compensation) || 0 });
      toast.success('Favour created!');
      setShowCreate(false);
      setRequesteeUsername(''); setRequesteeUser(null); setDescription(''); setCompensation('');
      load();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleComplete = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await favoursApi.complete(completion.favour_id, { review: completion.review });
      toast.success('Favour completed!'); setShowComplete(false); setCompletion(EMPTY_COMPLETE); load();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleIgnore = async (id) => {
    if (!confirm('Ignore this favour request? It will be removed.')) return;
    try { await favoursApi.ignore(id); toast.success('Favour ignored'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this favour?')) return;
    try { await favoursApi.remove(id); toast.success('Favour deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const STATUS_STYLE = { completed: 'bg-kred/10 text-kred', pending: 'bg-warn/10 text-warn', open: 'bg-muted/10 text-muted' };

  const columns = [
    { key: 'requestor',   label: 'Requestor',   render: (r) => <span className={`font-mono font-medium ${r.requestor_id === user.id ? 'text-accent' : ''}`}>{r.requestor}{r.requestor_id === user.id ? ' (you)' : ''}</span> },
    { key: 'requestee',   label: 'Requestee',   render: (r) => <span className={`font-mono font-medium ${r.requestee_id === user.id ? 'text-accent' : ''}`}>{r.requestee}{r.requestee_id === user.id ? ' (you)' : ''}</span> },
    { key: 'description', label: 'Description', render: (r) => r.description ? <span className="text-muted text-xs">{r.description}</span> : <span className="text-muted">—</span> },
    { key: 'compensation', label: 'Compensation', render: (r) => r.compensation > 0 ? <span className="font-mono text-xs text-accent">⚡ {parseFloat(r.compensation).toLocaleString()}</span> : <span className="text-muted">—</span> },
    { key: 'status',      label: 'Status',      render: (r) => <span className={`k-badge ${STATUS_STYLE[r.status] || ''}`}>{r.status}</span> },
    { key: 'done_at',     label: 'Completed',   render: (r) => r.done_at ? <span className="text-xs text-muted">{fmtDate(r.done_at)}</span> : <span className="text-muted">—</span> },
    { key: 'review',      label: 'Review',      render: (r) => r.review ? <span className="text-xs text-muted italic">"{r.review}"</span> : <span className="text-muted">—</span> },
    { key: 'actions',     label: '', render: (r) => (
      <div className="flex gap-2">
        {r.status === 'pending' && r.requestor_id === user.id && (
          <button onClick={() => { setCompletion({ favour_id: r.favour_id, review: '' }); setShowComplete(true); }} className="p-1.5 rounded text-muted hover:text-kred hover:bg-kred/10 transition-all" title="Mark Complete"><CheckCircle size={13} /></button>
        )}
        {r.status === 'pending' && r.requestee_id === user.id && (
          <button onClick={() => handleIgnore(r.favour_id)} className="p-1.5 rounded text-muted hover:text-warn hover:bg-warn/10 transition-all" title="Ignore"><XCircle size={13} /></button>
        )}
        {r.requestor_id === user.id && r.status !== 'completed' && (
          <button onClick={() => handleDelete(r.favour_id)} className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete"><Trash2 size={13} /></button>
        )}
      </div>
    )},
  ];

  const TABS = [{ key: 'all', label: 'All' }, { key: 'by_me', label: 'By Me' }, { key: 'for_me', label: 'For Me' }, { key: 'pending', label: 'Pending' }, { key: 'completed', label: 'Completed' }, { key: 'open', label: 'Open' }];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">My Favours</h1>
          <p className="text-muted text-sm mt-1">{favours.length} favours involving you</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="k-btn-primary flex items-center gap-2"><Plus size={14} /> Request Favour</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Pending', count: counts.pending, color: 'text-warn', bg: 'bg-warn/10' }, { label: 'Completed', count: counts.completed, color: 'text-kred', bg: 'bg-kred/10' }, { label: 'Open', count: counts.open, color: 'text-muted', bg: 'bg-muted/10' }].map(s => (
          <div key={s.label} className="k-card p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}><Handshake size={15} className={s.color} /></div>
            <div><p className="text-[10px] text-muted uppercase tracking-widest">{s.label}</p><p className={`font-mono text-xl font-bold ${s.color} mt-0.5`}>{s.count}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-bdr">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm transition-all relative ${tab === t.key ? 'text-accent font-medium' : 'text-muted hover:text-kred'}`}>
            {t.label}
            <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded ${tab === t.key ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'}`}>{counts[t.key]}</span>
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-px bg-accent" />}
          </button>
        ))}
      </div>

      <div className="k-card">
        <DataTable columns={columns} data={filtered} loading={loading} emptyText="No favours found." />
      </div>

      {showCreate && (
        <Modal title="Request a Favour" onClose={() => { setShowCreate(false); setRequesteeUsername(''); setRequesteeUser(null); setDescription(''); setCompensation(''); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="k-label">Who will do the favour? <span className="text-danger">*</span></label>
              <UserLookupInput
                value={requesteeUsername}
                onChange={setRequesteeUsername}
                onResolved={setRequesteeUser}
                excludeId={user.id}
                placeholder="Enter their username…"
                required
              />
            </div>
            <div>
              <label className="k-label">Description</label>
              <textarea className="k-input resize-none h-20" placeholder="Help me move furniture this weekend…"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="k-label">Compensation (kreds, optional)</label>
              <input className="k-input font-mono" type="number" min="0" step="0.01" placeholder="0"
                value={compensation} onChange={e => setCompensation(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting || !requesteeUser}>
                {submitting ? 'Creating…' : 'Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showComplete && (
        <Modal title="Complete Favour" onClose={() => { setShowComplete(false); setCompletion(EMPTY_COMPLETE); }}>
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="p-3 rounded-lg bg-kred/5 border border-kred/20 text-sm text-muted">Mark this favour as done. You can optionally leave a review.</div>
            <div>
              <label className="k-label">Review (optional)</label>
              <textarea className="k-input resize-none h-20" placeholder="Great help, would request again…"
                value={completion.review} onChange={e => setCompletion(p => ({ ...p, review: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowComplete(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary flex items-center gap-2" disabled={submitting}><CheckCircle size={13} />{submitting ? 'Completing…' : 'Mark Complete'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
