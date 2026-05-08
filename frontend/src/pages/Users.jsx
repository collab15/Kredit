import { useEffect, useState } from 'react';
import { Plus, Send, Trash2, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const EMPTY_USER   = { username: '', password: '', first_name: '', last_name: '', gender: '', age: '', email: '', phone: '', address: '' };
const EMPTY_XFER   = { sender_id: '', receiver_id: '', amount: '', description: '' };


function Field({ label, name, state, setState, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="k-label">{label}{required && <span className="text-danger ml-1">*</span>}</label>
      <input
        className="k-input"
        type={type}
        required={required}
        placeholder={placeholder}
        value={state[name]}
        onChange={(e) => setState(prev => ({ ...prev, [name]: e.target.value }))}
      />
    </div>
  );
}
export default function Users() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showXfer,    setShowXfer]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_USER);
  const [xfer,        setXfer]        = useState(EMPTY_XFER);
  const [submitting,  setSubmitting]  = useState(false);

  const load = () => {
    setLoading(true);
    usersApi.getAll().then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.create(form);
      toast.success('User created!');
      setShowCreate(false);
      setForm(EMPTY_USER);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.transfer(xfer);
      toast.success('Kreds transferred!');
      setShowXfer(false);
      setXfer(EMPTY_XFER);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await usersApi.remove(id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };



  const columns = [
    { key: 'avatar',      label: '',          render: (r) => (
      <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
        <UserCircle size={14} className="text-accent" />
      </div>
    )},
    { key: 'username',    label: 'Username',  render: (r) => <span className="font-mono font-bold text-white">{r.username}</span> },
    { key: 'name',        label: 'Name',      render: (r) => r.first_name ? `${r.first_name} ${r.last_name}` : <span className="text-muted">—</span> },
    { key: 'balance',     label: 'Balance',   render: (r) => (
      <span className="font-mono text-kred font-bold">⚡ {parseFloat(r.balance || 0).toLocaleString()}</span>
    )},
    { key: 'email',       label: 'Email',     render: (r) => r.email || <span className="text-muted">—</span> },
    { key: 'joining_date',label: 'Joined',    render: (r) => <span className="text-muted text-xs">{fmtDate(r.joining_date)}</span> },
    { key: 'actions',     label: '',          render: (r) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setXfer(prev => ({ ...prev, sender_id: r.user_id })); setShowXfer(true); }}
          className="p-1.5 rounded text-muted hover:text-accent hover:bg-accent/10 transition-all"
          title="Transfer kreds"
        >
          <Send size={13} />
        </button>
        <button
          onClick={() => handleDelete(r.user_id, r.username)}
          className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-all"
          title="Delete user"
        >
          <Trash2 size={13} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-white">Users</h1>
          <p className="text-muted text-sm mt-1">{users.length} registered accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowXfer(true)} className="k-btn-ghost flex items-center gap-2">
            <Send size={14} /> Transfer Kreds
          </button>
          <button onClick={() => setShowCreate(true)} className="k-btn-primary flex items-center gap-2">
            <Plus size={14} /> New User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="k-card">
        <DataTable columns={columns} data={users} loading={loading} emptyText="No users yet. Create one!" />
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <Modal title="Create New User" onClose={() => { setShowCreate(false); setForm(EMPTY_USER); }} maxWidth="max-w-lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username" name="username" state={form} setState={setForm} required placeholder="john_doe" />
              <Field label="Password" name="password" state={form} setState={setForm} type="password" required placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" name="first_name" state={form} setState={setForm} placeholder="John" />
              <Field label="Last Name"  name="last_name"  state={form} setState={setForm} placeholder="Doe" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="k-label">Gender</label>
                <select
                  className="k-input"
                  value={form.gender}
                  onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}
                >
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Field label="Age" name="age" state={form} setState={setForm} type="number" placeholder="25" />
            </div>
            <Field label="Email" name="email" state={form} setState={setForm} type="email" placeholder="john@example.com" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"   name="phone"   state={form} setState={setForm} placeholder="+92 300 0000000" />
              <Field label="Address" name="address" state={form} setState={setForm} placeholder="Rawalpindi, PK" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transfer Kreds Modal */}
      {showXfer && (
        <Modal title="Transfer Kreds" onClose={() => { setShowXfer(false); setXfer(EMPTY_XFER); }}>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="k-label">From User <span className="text-danger">*</span></label>
              <select
                className="k-input"
                required
                value={xfer.sender_id}
                onChange={(e) => setXfer(p => ({ ...p, sender_id: e.target.value }))}
              >
                <option value="">Select sender…</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.username} (⚡ {parseFloat(u.balance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="k-label">To User <span className="text-danger">*</span></label>
              <select
                className="k-input"
                required
                value={xfer.receiver_id}
                onChange={(e) => setXfer(p => ({ ...p, receiver_id: e.target.value }))}
              >
                <option value="">Select receiver…</option>
                {users
                  .filter(u => u.user_id !== xfer.sender_id)
                  .map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)
                }
              </select>
            </div>
            <div>
              <label className="k-label">Amount (Kreds) <span className="text-danger">*</span></label>
              <input
                className="k-input font-mono"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="100.00"
                value={xfer.amount}
                onChange={(e) => setXfer(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="k-label">Description</label>
              <input
                className="k-input"
                placeholder="Payment for favour…"
                value={xfer.description}
                onChange={(e) => setXfer(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowXfer(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary flex items-center gap-2" disabled={submitting}>
                <Send size={13} /> {submitting ? 'Sending…' : 'Send Kreds'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}