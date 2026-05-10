import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login({ identifier: username, password, role: 'admin' });
      if (data.role !== 'admin') {
        toast.error('Access denied — admin only');
        return;
      }
      login(data, data.token);
      toast.success(`Welcome, ${data.username}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center glow-accent">
            <Zap size={22} className="fill-black" />
          </div>
          <div>
            <p className="font-mono font-bold tracking-[0.25em] text-lg text-white">KREDIT</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Welfare Exchange Network</p>
          </div>
        </div>

        <div className="k-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ShieldCheck size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold text-white">Admin Access</h1>
              <p className="text-muted text-xs mt-0.5">Restricted — authorised personnel only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="k-label">Username</label>
              <input
                className="k-input"
                type="text"
                required
                autoComplete="username"
                placeholder="admin_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="k-label">Password</label>
              <div className="relative">
                <input
                  className="k-input pr-10"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={14} />
              {loading ? 'Signing in…' : 'Sign In as Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-muted">
            Not an admin?{' '}
            <button className="text-accent hover:underline" onClick={() => navigate('/login')}>
              Go to main login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
