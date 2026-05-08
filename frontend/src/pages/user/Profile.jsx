import { useEffect, useState } from 'react';
import { Save, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/client';
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

export default function UserProfile() {
  const { user }    = useAuth();
  const [profile,   setProfile]   = useState(null);
  const [form,      setForm]      = useState({});
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    usersApi.getOne(user.id).then(r => {
      setProfile(r.data);
      setForm({ first_name: r.data.first_name || '', last_name: r.data.last_name || '', gender: r.data.gender || '',
        age: r.data.age || '', email: r.data.email || '', phone: r.data.phone || '', address: r.data.address || '', password: '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try { await usersApi.update(user.id, form); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">My Profile</h1>
        <p className="text-muted text-sm mt-1">Update your personal information</p>
      </div>

      {/* Balance card */}
      <div className="k-card p-5 flex items-center gap-4 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
          <UserCircle size={20} className="text-accent" />
        </div>
        <div>
          <p className="font-mono font-bold text-white text-lg">{profile?.username}</p>
          <p className="font-mono text-kred font-bold">⚡ {parseFloat(profile?.balance || 0).toLocaleString()} kreds</p>
        </div>
      </div>

      <div className="max-w-lg k-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Field label="Email"   name="email"   state={form} setState={setForm} type="email" placeholder="john@example.com" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"   name="phone"   state={form} setState={setForm} placeholder="+92 300 0000000" />
            <Field label="Address" name="address" state={form} setState={setForm} placeholder="Rawalpindi, PK" />
          </div>
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
