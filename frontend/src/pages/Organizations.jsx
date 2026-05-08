import { useEffect, useState } from 'react';
import { Plus, Trash2, Building2, Award, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgsApi, usersApi } from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const EMPTY_ORG    = { org_type: 'agency', delegate: '', website: '', email: '', phone: '', address: '', services: '', scope: '' };
const EMPTY_REWARD = { org_id: '', user_id: '', amount: '', description: '' };


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
export default function Organizations() {
  const [orgs,        setOrgs]        = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('all');   // all | agency | partnered
  const [showCreate,  setShowCreate]  = useState(false);
  const [showReward,  setShowReward]  = useState(false);
  const [form,        setForm]        = useState(EMPTY_ORG);
  const [reward,      setReward]      = useState(EMPTY_REWARD);
  const [submitting,  setSubmitting]  = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([orgsApi.getAll(), usersApi.getAll()])
      .then(([o, u]) => { setOrgs(o.data); setUsers(u.data); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = tab === 'all'
    ? orgs
    : orgs.filter(o => o.org_type === tab);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await orgsApi.create(form);
      toast.success('Organization created!');
      setShowCreate(false);
      setForm(EMPTY_ORG);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReward = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await orgsApi.reward(reward);
      toast.success('User rewarded with kreds!');
      setShowReward(false);
      setReward(EMPTY_REWARD);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this organization? This cannot be undone.')) return;
    try {
      await orgsApi.remove(id);
      toast.success('Organization deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };



  const columns = [
    { key: 'icon',      label: '',           render: (r) => (
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.org_type === 'agency' ? 'bg-violet-500/10' : 'bg-cyan-500/10'}`}>
        {r.org_type === 'agency'
          ? <ShieldCheck size={13} className="text-violet-400" />
          : <Award       size={13} className="text-cyan-400" />
        }
      </div>
    )},
    { key: 'org_type',  label: 'Type',       render: (r) => (
      <span className={`k-badge ${r.org_type === 'agency' ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
        {r.org_type}
      </span>
    )},
    { key: 'delegate',  label: 'Delegate',   render: (r) => r.delegate || <span className="text-muted">—</span> },
    { key: 'scope',     label: 'Scope / Services', render: (r) => (
      <span className="text-slate-400 text-xs">{r.scope || r.services || <span className="text-muted">—</span>}</span>
    )},
    { key: 'email',     label: 'Email',      render: (r) => r.email || <span className="text-muted">—</span> },
    { key: 'api_key',   label: 'API Key',    render: (r) => (
      <span className="font-mono text-[10px] text-muted bg-surface2 border border-bdr px-2 py-1 rounded">
        {r.api_key?.slice(0, 20)}…
      </span>
    )},
    { key: 'actions',   label: '',           render: (r) => (
      <div className="flex items-center gap-2">
        {r.org_type === 'agency' && (
          <button
            onClick={() => { setReward(p => ({ ...p, org_id: r.org_id })); setShowReward(true); }}
            className="p-1.5 rounded text-muted hover:text-kred hover:bg-kred/10 transition-all"
            title="Reward a user"
          >
            <Award size={13} />
          </button>
        )}
        <button
          onClick={() => handleDelete(r.org_id)}
          className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-all"
          title="Delete org"
        >
          <Trash2 size={13} />
        </button>
      </div>
    )},
  ];

  const TABS = [
    { key: 'all',       label: 'All',       count: orgs.length },
    { key: 'agency',    label: 'Agencies',  count: orgs.filter(o => o.org_type === 'agency').length },
    { key: 'partnered', label: 'Partnered', count: orgs.filter(o => o.org_type === 'partnered').length },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-white">Organizations</h1>
          <p className="text-muted text-sm mt-1">{orgs.length} registered organizations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReward(true)} className="k-btn-ghost flex items-center gap-2">
            <Award size={14} /> Reward User
          </button>
          <button onClick={() => setShowCreate(true)} className="k-btn-primary flex items-center gap-2">
            <Plus size={14} /> New Org
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bdr">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm transition-all relative ${
              tab === t.key
                ? 'text-accent font-medium'
                : 'text-muted hover:text-slate-300'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded ${
              tab === t.key ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'
            }`}>
              {t.count}
            </span>
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="k-card">
        <DataTable columns={columns} data={filtered} loading={loading} emptyText="No organizations found." />
      </div>

      {/* Create Org Modal */}
      {showCreate && (
        <Modal title="Register Organization" onClose={() => { setShowCreate(false); setForm(EMPTY_ORG); }} maxWidth="max-w-lg">
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="k-label">Organization Type <span className="text-danger">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {['agency', 'partnered'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, org_type: type }))}
                    className={`py-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                      form.org_type === type
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-bdr text-muted hover:border-accent/40'
                    }`}
                  >
                    {type === 'agency'
                      ? <><ShieldCheck size={13} className="inline mr-1.5" />Agency</>
                      : <><Award       size={13} className="inline mr-1.5" />Partnered</>
                    }
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Delegate Name" name="delegate" state={form} setState={setForm} placeholder="Jane Smith" />
              <Field label="Website"       name="website"  state={form} setState={setForm} placeholder="https://example.org" />
            </div>

            <Field label="Email" name="email" state={form} setState={setForm} type="email" placeholder="org@example.com" />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"   name="phone"   state={form} setState={setForm} placeholder="+92 300 0000000" />
              <Field label="Address" name="address" state={form} setState={setForm} placeholder="City, Country" />
            </div>

            {form.org_type === 'agency' ? (
              <div>
                <label className="k-label">Scope (Welfare Area)</label>
                <input
                  className="k-input"
                  placeholder="e.g. Community Service, Environment, Education"
                  value={form.scope}
                  onChange={e => setForm(p => ({ ...p, scope: e.target.value }))}
                />
              </div>
            ) : (
              <div>
                <label className="k-label">Services Offered</label>
                <input
                  className="k-input"
                  placeholder="e.g. Healthcare, Transport, Food"
                  value={form.services}
                  onChange={e => setForm(p => ({ ...p, services: e.target.value }))}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>
                {submitting ? 'Registering…' : 'Register Org'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reward User Modal */}
      {showReward && (
        <Modal title="Reward User with Kreds" onClose={() => { setShowReward(false); setReward(EMPTY_REWARD); }}>
          <form onSubmit={handleReward} className="space-y-4">
            <div>
              <label className="k-label">Agency <span className="text-danger">*</span></label>
              <select
                className="k-input"
                required
                value={reward.org_id}
                onChange={e => setReward(p => ({ ...p, org_id: e.target.value }))}
              >
                <option value="">Select agency…</option>
                {orgs.filter(o => o.org_type === 'agency').map(o => (
                  <option key={o.org_id} value={o.org_id}>
                    {o.delegate || 'Unnamed'} — {o.scope || 'No scope'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="k-label">Reward User <span className="text-danger">*</span></label>
              <select
                className="k-input"
                required
                value={reward.user_id}
                onChange={e => setReward(p => ({ ...p, user_id: e.target.value }))}
              >
                <option value="">Select user…</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.username} (⚡ {parseFloat(u.balance || 0).toLocaleString()})
                  </option>
                ))}
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
                placeholder="50.00"
                value={reward.amount}
                onChange={e => setReward(p => ({ ...p, amount: e.target.value }))}
              />
            </div>

            <div>
              <label className="k-label">Description</label>
              <input
                className="k-input"
                placeholder="Rewarded for volunteering…"
                value={reward.description}
                onChange={e => setReward(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowReward(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary flex items-center gap-2" disabled={submitting}>
                <Award size={13} /> {submitting ? 'Rewarding…' : 'Reward User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}