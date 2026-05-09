import { useEffect, useState } from 'react';
import { Plus, Trash2, UserCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/client';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const EMPTY_USER = { username: '', password: '', first_name: '', last_name: '', gender: '', age: '', email: '', phone: '', address: '' };
const EMPTY_EDIT = { first_name: '', last_name: '', gender: '', age: '', email: '', phone: '', address: '', password: '' };

function Field({ label, name, state, setState, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="k-label">{label}{required && <span className="text-danger ml-1">*</span>}</label>
      <input className="k-input" type={type} required={required} placeholder={placeholder} value={state[name]}
        onChange={(e) => setState(p => ({ ...p, [name]: e.target.value }))} />
    </div>
  );
}

export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_USER);
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT);
  const [submitting, setSubmitting] = useState(false);
  const [search,     setSearch]     = useState('');

  const load = () => { setLoading(true); usersApi.getAll().then(r => setUsers(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const filtered = search ? users.filter(u => JSON.stringify(u).toLowerCase().includes(search.toLowerCase())) : users;

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await usersApi.create(form); toast.success('User created!'); setShowCreate(false); setForm(EMPTY_USER); load(); }
    catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ first_name: u.first_name || '', last_name: u.last_name || '', gender: u.gender || '',
      age: u.age || '', email: u.email || '', phone: u.phone || '', address: u.address || '', password: '' });
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await usersApi.update(editUser.user_id, editForm); toast.success('User updated!'); setEditUser(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete "${username}"?`)) return;
    try { await usersApi.remove(id); toast.success('User deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const columns = [
    { key: 'av',       label: '', render: () => <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center"><UserCircle size={14} className="text-accent" /></div> },
    { key: 'username', label: 'Username', render: (r) => <span className="font-mono font-bold text-white">{r.username}</span> },
    { key: 'name',     label: 'Name',    render: (r) => r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : <span className="text-muted">—</span> },
    { key: 'balance',  label: 'Balance', render: (r) => <span className="font-mono text-kred font-bold">⚡ {parseFloat(r.balance || 0).toLocaleString()}</span> },
    { key: 'email',    label: 'Email',   render: (r) => r.email || <span className="text-muted">—</span> },
    { key: 'joining_date', label: 'Joined', render: (r) => <span className="text-muted text-xs">{fmtDate(r.joining_date)}</span> },
    { key: 'actions',  label: '', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded text-muted hover:text-accent hover:bg-accent/10 transition-all" title="Edit"><Edit2 size={13} /></button>
        <button onClick={() => handleDelete(r.user_id, r.username)} className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete"><Trash2 size={13} /></button>
      </div>
    )},
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-white">Users</h1>
          <p className="text-muted text-sm mt-1">{users.length} registered accounts</p>
        </div>
        <div className="flex gap-2">
          <input className="k-input w-48 text-xs" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={() => setShowCreate(true)} className="k-btn-primary flex items-center gap-2"><Plus size={14} /> New User</button>
        </div>
      </div>

      <div className="k-card">
        <DataTable columns={columns} data={filtered} loading={loading} emptyText="No users found." />
      </div>

      {showCreate && (
        <Modal title="Create User" onClose={() => { setShowCreate(false); setForm(EMPTY_USER); }} maxWidth="max-w-lg">
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
                <select className="k-input" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
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
              <button type="submit" className="k-btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create User'}</button>
            </div>
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Edit ${editUser.username}`} onClose={() => setEditUser(null)} maxWidth="max-w-lg">
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" name="first_name" state={editForm} setState={setEditForm} placeholder="John" />
              <Field label="Last Name"  name="last_name"  state={editForm} setState={setEditForm} placeholder="Doe" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="k-label">Gender</label>
                <select className="k-input" value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Field label="Age" name="age" state={editForm} setState={setEditForm} type="number" placeholder="25" />
            </div>
            <Field label="Email"   name="email"   state={editForm} setState={setEditForm} type="email" placeholder="john@example.com" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"   name="phone"   state={editForm} setState={setEditForm} placeholder="+92 300" />
              <Field label="Address" name="address" state={editForm} setState={setEditForm} placeholder="City, PK" />
            </div>
            <Field label="New Password (leave blank to keep)" name="password" state={editForm} setState={setEditForm} type="password" placeholder="••••••••" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
