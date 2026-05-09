import { useEffect, useState } from 'react';
import { Plus, Trash2, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function AdminAdmins() {
  const { user }     = useAuth();
  const [admins,     setAdmins]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [pwAdmin,    setPwAdmin]    = useState(null);
  const [form,       setForm]       = useState({ username: '', password: '' });
  const [newPw,      setNewPw]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    adminsApi.getAll().then(r => setAdmins(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminsApi.create(form);
      toast.success('Admin created!');
      setShowCreate(false); setForm({ username: '', password: '' }); load();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleChangePw = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminsApi.update(pwAdmin.admin_id, { password: newPw });
      toast.success('Password updated!');
      setPwAdmin(null); setNewPw('');
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete admin "${username}"? This cannot be undone.`)) return;
    try { await adminsApi.remove(id); toast.success('Admin deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const columns = [
    { key: 'av', label: '', render: () => (
      <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        <ShieldCheck size={13} className="text-violet-400" />
      </div>
    )},
    { key: 'username',     label: 'Username',  render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-white">{r.username}</span>
        {r.admin_id === user?.id && <span className="k-badge bg-accent/10 text-accent text-[9px]">you</span>}
      </div>
    )},
    { key: 'joining_date', label: 'Joined',    render: (r) => <span className="text-muted text-xs">{fmtDate(r.joining_date)}</span> },
    { key: 'actions',      label: '', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => { setPwAdmin(r); setNewPw(''); }}
          className="p-1.5 rounded text-muted hover:text-accent hover:bg-accent/10 transition-all" title="Change password">
          <KeyRound size={13} />
        </button>
        <button onClick={() => handleDelete(r.admin_id, r.username)}
          disabled={r.admin_id === user?.id}
          className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-white">Admins</h1>
          <p className="text-muted text-sm mt-1">{admins.length} admin account{admins.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="k-btn-primary flex items-center gap-2">
          <Plus size={14} /> New Admin
        </button>
      </div>

      <div className="k-card">
        <DataTable columns={columns} data={admins} loading={loading} emptyText="No admins found." />
      </div>

      {showCreate && (
        <Modal title="Create Admin" onClose={() => { setShowCreate(false); setForm({ username: '', password: '' }); }} maxWidth="max-w-sm">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="k-label">Username <span className="text-danger">*</span></label>
              <input className="k-input" required placeholder="admin_name" value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            </div>
            <div>
              <label className="k-label">Password <span className="text-danger">*</span></label>
              <input className="k-input" type="password" required placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Admin'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {pwAdmin && (
        <Modal title={`Change Password — ${pwAdmin.username}`} onClose={() => setPwAdmin(null)} maxWidth="max-w-sm">
          <form onSubmit={handleChangePw} className="space-y-4">
            <div>
              <label className="k-label">New Password <span className="text-danger">*</span></label>
              <input className="k-input" type="password" required placeholder="••••••••" value={newPw}
                onChange={e => setNewPw(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setPwAdmin(null)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
