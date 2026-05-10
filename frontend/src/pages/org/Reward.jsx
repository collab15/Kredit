import { useEffect, useState } from 'react';
import { Award, Search, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgsApi, usersApi } from '../../api/client';

export default function OrgReward() {
  const [users,      setUsers]      = useState([]);
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const [amount,     setAmount]     = useState('');
  const [desc,       setDesc]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    usersApi.getAll().then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.last_name  || '').toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleReward = async (e) => {
    e.preventDefault();
    if (!selected) { toast.error('Select a user first'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await orgsApi.reward({ user_id: selected.user_id, amount: amt, description: desc || undefined });
      toast.success(`⚡ ${amt.toLocaleString()} kreds sent to ${selected.username}`);
      setSelected(null);
      setAmount('');
      setDesc('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">Send Kreds to User</h1>
        <p className="text-muted text-sm mt-1">As an agency, you can issue unlimited kreds to any registered user.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start">

        {/* User picker */}
        <div className="k-card flex flex-col" style={{ maxHeight: '520px' }}>
          <div className="px-4 py-3 border-b border-bdr">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="k-input pl-8 text-xs"
                placeholder="Search username or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-muted text-xs text-center p-6">No users found.</p>
            ) : (
              filtered.map(u => (
                <button
                  key={u.user_id}
                  type="button"
                  onClick={() => setSelected(u)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-bdr/50 text-left transition-all hover:bg-accent/5 ${
                    selected?.user_id === u.user_id ? 'bg-accent/5 border-l-2 border-l-accent' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-accent uppercase">{u.username[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-white truncate">{u.username}</p>
                    {(u.first_name || u.last_name) && (
                      <p className="text-[10px] text-muted">{[u.first_name, u.last_name].filter(Boolean).join(' ')}</p>
                    )}
                  </div>
                  <div className="ml-auto shrink-0">
                    <span className="font-mono text-xs text-muted">⚡ {parseFloat(u.balance || 0).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Reward form */}
        <div className="k-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-kred/10 flex items-center justify-center">
              <Award size={16} className="text-kred" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Issue Kreds</p>
              <p className="text-[10px] text-muted">
                {selected ? `→ ${selected.username}` : 'Select a user from the list'}
              </p>
            </div>
          </div>

          {selected && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-xs font-bold text-accent uppercase">{selected.username[0]}</span>
              </div>
              <div>
                <p className="text-sm font-mono font-bold text-white">{selected.username}</p>
                <p className="text-[10px] text-muted">Current balance: ⚡ {parseFloat(selected.balance || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-muted hover:text-accent transition-colors text-xs">✕</button>
            </div>
          )}

          <form onSubmit={handleReward} className="space-y-4">
            <div>
              <label className="k-label">Amount (kreds)</label>
              <div className="relative">
                <Zap size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="k-input pl-8"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="100"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="k-label">Description (optional)</label>
              <input
                className="k-input"
                type="text"
                placeholder="Community service reward…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                maxLength={200}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !selected}
              className="k-btn-primary w-full justify-center py-2.5 gap-2 disabled:opacity-40"
            >
              <Award size={14} />
              {submitting ? 'Sending…' : 'Send Kreds'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
