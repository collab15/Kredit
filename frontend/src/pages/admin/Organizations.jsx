import { useEffect, useState } from 'react';
import { Plus, Trash2, Award, ShieldCheck, Edit2, Eye, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgsApi } from '../../api/client';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import UserLookupInput from '../../components/UserLookupInput';

const EMPTY_ORG    = { org_type: 'agency', name: '', delegate: '', website: '', email: '', phone: '', address: '', services: '', scope: '', password: '' };
const EMPTY_EDIT   = { name: '', delegate: '', website: '', email: '', phone: '', address: '', services: '', scope: '', password: '' };
const EMPTY_REWARD = { org_id: '', amount: '', description: '' };

function Field({ label, name, state, setState, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="k-label">{label}{required && <span className="text-danger ml-1">*</span>}</label>
      <input className="k-input" type={type} required={required} placeholder={placeholder} value={state[name]}
        onChange={e => setState(p => ({ ...p, [name]: e.target.value }))} />
    </div>
  );
}

function ApiKeyCell({ apiKey }) {
  const [show, setShow] = useState(false);
  const copy = () => { navigator.clipboard.writeText(apiKey); toast.success('API key copied!'); };
  return (
    <div className="flex items-center gap-1.5 max-w-[220px]">
      <span className="font-mono text-[10px] text-muted bg-surface2 border border-bdr px-2 py-1 rounded truncate flex-1">
        {show ? apiKey : `${apiKey?.slice(0, 12)}…`}
      </span>
      <button onClick={() => setShow(v => !v)} className="text-muted hover:text-accent transition-colors shrink-0" title={show ? 'Hide' : 'Show'}>
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button onClick={copy} className="text-muted hover:text-accent transition-colors shrink-0" title="Copy">
        <Copy size={12} />
      </button>
    </div>
  );
}

export default function AdminOrganizations() {
  const [orgs,       setOrgs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [editOrg,    setEditOrg]    = useState(null);
  const [form,       setForm]       = useState(EMPTY_ORG);
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT);
  const [reward,     setReward]     = useState(EMPTY_REWARD);
  const [submitting, setSubmitting] = useState(false);

  const [rewardAgencyQuery,   setRewardAgencyQuery]   = useState('');
  const [rewardAgency,        setRewardAgency]        = useState(null);
  const [rewardUserName,      setRewardUserName]      = useState('');
  const [rewardUser,          setRewardUser]          = useState(null);

  const load = () => {
    setLoading(true);
    orgsApi.getAll().then(r => setOrgs(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = tab === 'all' ? orgs : orgs.filter(o => o.org_type === tab);
  const agencies = orgs.filter(o => o.org_type === 'agency');

  const matchingAgencies = rewardAgencyQuery.length >= 1
    ? agencies.filter(o => (o.display_name || o.delegate || '').toLowerCase().includes(rewardAgencyQuery.toLowerCase()))
    : agencies;

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await orgsApi.create(form); toast.success('Organization created!'); setShowCreate(false); setForm(EMPTY_ORG); load(); }
    catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const openEdit = (o) => {
    setEditOrg(o);
    setEditForm({ name: o.name || '', delegate: o.delegate || '', website: o.website || '',
      email: o.email || '', phone: o.phone || '', address: o.address || '',
      services: o.services || '', scope: o.scope || '', password: '' });
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await orgsApi.update(editOrg.org_id, editForm); toast.success('Org updated!'); setEditOrg(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleReward = async (e) => {
    e.preventDefault();
    if (!rewardAgency) { toast.error('Please select an agency'); return; }
    if (!rewardUser)   { toast.error('Please enter a valid username'); return; }
    setSubmitting(true);
    try {
      await orgsApi.reward({ org_id: rewardAgency.org_id, user_id: rewardUser.user_id, amount: reward.amount, description: reward.description });
      toast.success('User rewarded!');
      setShowReward(false);
      setRewardAgencyQuery(''); setRewardAgency(null);
      setRewardUserName(''); setRewardUser(null);
      setReward(EMPTY_REWARD);
      load();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this organization?')) return;
    try { await orgsApi.remove(id); toast.success('Organization deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const TABS = [
    { key: 'all',       label: 'All',       count: orgs.length },
    { key: 'agency',    label: 'Agencies',  count: orgs.filter(o => o.org_type === 'agency').length },
    { key: 'partnered', label: 'Partnered', count: orgs.filter(o => o.org_type === 'partnered').length },
  ];

  const columns = [
    { key: 'icon',      label: '', render: (r) => (
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.org_type === 'agency' ? 'bg-violet-100' : 'bg-orange-100'}`}>
        {r.org_type === 'agency' ? <ShieldCheck size={13} className="text-violet-600" /> : <Award size={13} className="text-orange-600" />}
      </div>
    )},
    { key: 'org_type',     label: 'Type',    render: (r) => <span className={`k-badge ${r.org_type === 'agency' ? 'bg-violet-100 text-violet-600' : 'bg-orange-100 text-orange-600'}`}>{r.org_type}</span> },
    { key: 'display_name', label: 'Name',    render: (r) => <span className="font-semibold">{r.display_name || r.delegate || '—'}</span> },
    { key: 'scope',        label: 'Details', render: (r) => <span className="text-muted text-xs">{r.scope || r.services || '—'}</span> },
    { key: 'email',        label: 'Email',   render: (r) => r.email || <span className="text-muted">—</span> },
    { key: 'api_key',      label: 'API Key', render: (r) => <ApiKeyCell apiKey={r.api_key} /> },
    { key: 'actions',      label: '', render: (r) => (
      <div className="flex gap-2">
        {r.org_type === 'agency' && (
          <button onClick={() => { setRewardAgencyQuery(r.display_name || r.delegate || ''); setRewardAgency(r); setShowReward(true); }} className="p-1.5 rounded text-muted hover:text-kred hover:bg-kred/10 transition-all" title="Reward user"><Award size={13} /></button>
        )}
        <button onClick={() => openEdit(r)} className="p-1.5 rounded text-muted hover:text-accent hover:bg-accent/10 transition-all" title="Edit"><Edit2 size={13} /></button>
        <button onClick={() => handleDelete(r.org_id)} className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete"><Trash2 size={13} /></button>
      </div>
    )},
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">Organizations</h1>
          <p className="text-muted text-sm mt-1">{orgs.length} registered organizations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReward(true)} className="k-btn-ghost flex items-center gap-2"><Award size={14} /> Reward User</button>
          <button onClick={() => setShowCreate(true)} className="k-btn-primary flex items-center gap-2"><Plus size={14} /> New Org</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-bdr">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm transition-all relative ${tab === t.key ? 'text-accent font-medium' : 'text-muted hover:text-kred'}`}>
            {t.label}
            <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded ${tab === t.key ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'}`}>{t.count}</span>
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-px bg-accent" />}
          </button>
        ))}
      </div>

      <div className="k-card">
        <DataTable columns={columns} data={filtered} loading={loading} emptyText="No organizations found." />
      </div>

      {showCreate && (
        <Modal title="Register Organization" onClose={() => { setShowCreate(false); setForm(EMPTY_ORG); }} maxWidth="max-w-lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="k-label">Type <span className="text-danger">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {['agency', 'partnered'].map(type => (
                  <button key={type} type="button" onClick={() => setForm(p => ({ ...p, org_type: type }))}
                    className={`py-3 rounded-lg border text-sm font-medium capitalize transition-all ${form.org_type === type ? 'border-accent bg-accent/10 text-accent' : 'border-bdr text-muted hover:border-accent/40'}`}>
                    {type === 'agency' ? <><ShieldCheck size={13} className="inline mr-1.5" />Agency</> : <><Award size={13} className="inline mr-1.5" />Partnered</>}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Org Name" name="name" state={form} setState={setForm} placeholder="City Welfare" />
              <Field label="Delegate" name="delegate" state={form} setState={setForm} placeholder="Jane Smith" />
            </div>
            <Field label="Password (for org login)" name="password" state={form} setState={setForm} type="password" required placeholder="••••••••" />
            <Field label="Email" name="email" state={form} setState={setForm} type="email" placeholder="org@example.com" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" name="phone" state={form} setState={setForm} placeholder="+92 300" />
              <Field label="Website" name="website" state={form} setState={setForm} placeholder="https://..." />
            </div>
            <Field label="Address" name="address" state={form} setState={setForm} placeholder="City, Country" />
            {form.org_type === 'agency'
              ? <Field label="Scope" name="scope" state={form} setState={setForm} placeholder="Community Service" />
              : <Field label="Services" name="services" state={form} setState={setForm} placeholder="Healthcare, Food" />
            }
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Register'}</button>
            </div>
          </form>
        </Modal>
      )}

      {editOrg && (
        <Modal title={`Edit ${editOrg.display_name || editOrg.delegate || 'Org'}`} onClose={() => setEditOrg(null)} maxWidth="max-w-lg">
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="p-3 rounded-xl bg-surface2 border border-bdr flex items-center gap-2">
              <span className="text-[10px] text-muted uppercase tracking-widest">API Key</span>
              <span className="font-mono text-xs text-muted ml-auto">{editOrg.api_key}</span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(editOrg.api_key); toast.success('Copied!'); }} className="text-muted hover:text-accent transition-colors"><Copy size={12} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Org Name" name="name" state={editForm} setState={setEditForm} placeholder="City Welfare" />
              <Field label="Delegate" name="delegate" state={editForm} setState={setEditForm} placeholder="Jane Smith" />
            </div>
            <Field label="Email" name="email" state={editForm} setState={setEditForm} type="email" placeholder="org@example.com" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" name="phone" state={editForm} setState={setEditForm} placeholder="+92 300" />
              <Field label="Website" name="website" state={editForm} setState={setEditForm} placeholder="https://..." />
            </div>
            <Field label="Address" name="address" state={editForm} setState={setEditForm} placeholder="City, Country" />
            {editOrg.org_type === 'agency'
              ? <Field label="Scope" name="scope" state={editForm} setState={setEditForm} placeholder="Community Service" />
              : <Field label="Services" name="services" state={editForm} setState={setEditForm} placeholder="Healthcare, Food" />
            }
            <Field label="New Password (leave blank to keep)" name="password" state={editForm} setState={setEditForm} type="password" placeholder="••••••••" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setEditOrg(null)}>Cancel</button>
              <button type="submit" className="k-btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showReward && (
        <Modal title="Reward User with Kreds" onClose={() => { setShowReward(false); setRewardAgencyQuery(''); setRewardAgency(null); setRewardUserName(''); setRewardUser(null); setReward(EMPTY_REWARD); }}>
          <form onSubmit={handleReward} className="space-y-4">
            <div>
              <label className="k-label">Agency Name <span className="text-danger">*</span></label>
              <div className="space-y-1.5">
                <div className="relative">
                  <input className="k-input" placeholder="Search agency…"
                    value={rewardAgencyQuery}
                    onChange={e => { setRewardAgencyQuery(e.target.value); setRewardAgency(null); }} />
                </div>
                {rewardAgencyQuery && !rewardAgency && (
                  <div className="border border-bdr rounded-xl overflow-hidden max-h-36 overflow-y-auto bg-white/90 backdrop-blur">
                    {matchingAgencies.length === 0 ? (
                      <p className="text-xs text-muted text-center py-3">No agencies found</p>
                    ) : matchingAgencies.map(o => (
                      <button key={o.org_id} type="button"
                        onClick={() => { setRewardAgency(o); setRewardAgencyQuery(o.display_name || o.delegate || 'Unnamed'); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent/6 transition-colors border-b border-bdr/50 last:border-0">
                        <span className="font-medium">{o.display_name || o.delegate || 'Unnamed'}</span>
                        {o.scope && <span className="text-muted ml-2 text-xs">{o.scope}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {rewardAgency && (
                  <p className="text-xs text-accent mt-1 ml-1 font-medium">✓ {rewardAgency.display_name || rewardAgency.delegate}</p>
                )}
              </div>
            </div>
            <div>
              <label className="k-label">User Username <span className="text-danger">*</span></label>
              <UserLookupInput
                value={rewardUserName}
                onChange={setRewardUserName}
                onResolved={setRewardUser}
                placeholder="Enter username to reward…"
                required
              />
            </div>
            <div>
              <label className="k-label">Amount <span className="text-danger">*</span></label>
              <input className="k-input font-mono" type="number" min="0.01" step="0.01" required placeholder="50.00"
                value={reward.amount} onChange={e => setReward(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className="k-label">Description</label>
              <input className="k-input" placeholder="Rewarded for volunteering…"
                value={reward.description} onChange={e => setReward(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="k-btn-ghost" onClick={() => setShowReward(false)}>Cancel</button>
              <button type="submit" className="k-btn-primary flex items-center gap-2" disabled={submitting || !rewardAgency || !rewardUser}>
                <Award size={13} />{submitting ? 'Rewarding…' : 'Reward'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
