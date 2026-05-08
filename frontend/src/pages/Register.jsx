import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
        onChange={(e) => setState(p => ({ ...p, [name]: e.target.value }))}
      />
    </div>
  );
}

const EMPTY = { username: '', password: '', first_name: '', last_name: '', gender: '', age: '', email: '', phone: '', address: '' };

export default function Register() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      login(data, data.token);
      toast.success('Account created!');
      navigate('/user');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 blur-[140px] rounded-full" />
      </div>
      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center glow-accent">
            <Zap size={22} className="fill-black" />
          </div>
          <div>
            <p className="font-mono font-bold tracking-[0.25em] text-lg text-white">KREDIT</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Welfare Exchange Network</p>
          </div>
        </div>
        <div className="k-card p-6 space-y-5">
          <div>
            <h1 className="font-mono text-xl font-bold text-white">Create Account</h1>
            <p className="text-muted text-sm mt-1">Join the Kredit network</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <select className="k-input" value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}>
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
            <button type="submit" disabled={loading} className="k-btn-primary w-full justify-center py-2.5">
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-xs text-muted">
            Already have an account?{' '}
            <button className="text-accent hover:underline" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
