import { useEffect, useState } from 'react';
import { Save, Building2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function Field({ label, name, state, setState, type = 'text', placeholder }) {
  return (
    <div>
      <label className="k-label">{label}</label>
      <input className="k-input" type={type} placeholder={placeholder} value={state[name] || ''}
        onChange={e => setState(p => ({ ...p, [name]: e.target.value }))} />
    </div>
  );
}

export default function OrgProfile() {
  const { user }      = useAuth();
  const isAgency      = user?.org_type === 'agency';
  const [profile,     setProfile]     = useState(null);
  const [form,        setForm]        = useState({});
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [showApiKey,  setShowApiKey]  = useState(false);

  useEffect(() => {
    orgsApi.getMe().then(r => {
      setProfile(r.data);
      setForm({ name: r.data.name || '', delegate: r.data.delegate || '', website: r.data.website || '',
        email: r.data.email || '', phone: r.data.phone || '', address: r.data.address || '',
        services: r.data.services || '', scope: r.data.scope || '', password: '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await orgsApi.update(user.id, form); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">Organization Profile</h1>
        <p className="text-muted text-sm mt-1">Manage your organization's information</p>
      </div>

      {/* Org card */}
      <div className="k-card p-5 flex items-center gap-4 max-w-md">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAgency ? 'bg-violet-500/10' : 'bg-cyan-500/10'}`}>
          {isAgency ? <Building2 size={20} className="text-violet-400" /> : <Award size={20} className="text-cyan-400" />}
        </div>
        <div>
          <p className="font-semibold text-white">{profile?.name || profile?.delegate || 'Unnamed Org'}</p>
          <p className={`text-xs k-badge mt-1 ${isAgency ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{user?.org_type}</p>
          <p className="font-mono text-kred text-sm mt-1">⚡ {parseFloat(profile?.balance || 0).toLocaleString()} kreds</p>
        </div>
      </div>

      {/* API Key */}
      <div className="k-card p-4 max-w-md">
        <p className="text-[10px] text-muted uppercase tracking-widest mb-2">API Key (login identifier)</p>
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs text-accent bg-surface2 border border-bdr px-3 py-2 rounded-lg flex-1 overflow-hidden text-ellipsis">
            {showApiKey ? profile?.api_key : `${profile?.api_key?.slice(0, 12)}••••••••••••••••`}
          </code>
          <button onClick={() => setShowApiKey(v => !v)} className="k-btn-ghost text-xs px-3 py-2">
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="max-w-lg k-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Org Name"  name="name"     state={form} setState={setForm} placeholder="City Welfare" />
            <Field label="Delegate"  name="delegate" state={form} setState={setForm} placeholder="Jane Smith" />
          </div>
          <Field label="Email"   name="email"   state={form} setState={setForm} type="email" placeholder="org@example.com" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"   name="phone"   state={form} setState={setForm} placeholder="+92 300 0000000" />
            <Field label="Website" name="website" state={form} setState={setForm} placeholder="https://..." />
          </div>
          <Field label="Address" name="address" state={form} setState={setForm} placeholder="City, Country" />
          {isAgency
            ? <Field label="Scope" name="scope" state={form} setState={setForm} placeholder="Community Service, Education" />
            : <Field label="Services" name="services" state={form} setState={setForm} placeholder="Healthcare, Transport, Food" />
          }
          <div className="border-t border-bdr pt-4">
            <Field label="New Password (leave blank to keep)" name="password" state={form} setState={setForm} type="password" placeholder="••••••••" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={submitting} className="k-btn-primary flex items-center gap-2">
              <Save size={13} />{submitting ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
