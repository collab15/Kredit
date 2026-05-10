import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { key: 'user', label: 'User', icon: User      },
  { key: 'org',  label: 'Org',  icon: Building2 },
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [role,       setRole]       = useState('user');
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const idLabel = role === 'org' ? 'API Key' : 'Username';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login({ identifier, password, role });
      login(data, data.token);
      if (data.role === 'org') navigate('/org');
      else                     navigate('/user');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-300/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center glow-accent">
            <Zap size={22} className="fill-white text-white" />
          </div>
          <div>
            <p className="font-mono font-bold tracking-[0.25em] text-lg" style={{ color: '#1C0F06' }}>KREDIT</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Welfare Exchange Network</p>
          </div>
        </div>

        <div className="k-card p-6 space-y-5">
          <div>
            <h1 className="font-mono text-xl font-bold" style={{ color: '#1C0F06' }}>Sign In</h1>
            <p className="text-muted text-sm mt-1">Choose your role to continue</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setRole(key); setError(''); }}
                className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all ${
                  role === key
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-bdr text-muted hover:border-accent/40 hover:text-accent hover:bg-accent/5'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-danger/8 border border-danger/25 text-danger text-sm animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="k-label">{idLabel}</label>
              <input
                className="k-input"
                type="text"
                required
                autoComplete="username"
                placeholder={role === 'org' ? 'krd_xxxxxxxxxxxxxxxx' : 'your_username'}
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
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
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
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
              className="k-btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-muted">
            New user?{' '}
            <button className="text-accent hover:underline font-medium" onClick={() => navigate('/register')}>
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
