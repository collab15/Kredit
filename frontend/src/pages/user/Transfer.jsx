import { useEffect, useState } from 'react';
import { Send, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi, orgsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function UserTransfer() {
  const { user }  = useAuth();
  const [users,   setUsers]   = useState([]);
  const [orgs,    setOrgs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode,    setMode]    = useState('user');
  const [form,    setForm]    = useState({ receiver_id: '', org_id: '', amount: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([usersApi.getAll(), orgsApi.getPartnered()])
      .then(([u, o]) => { setUsers(u.data.filter(u => u.user_id !== user.id)); setOrgs(o.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (mode === 'user') {
        await usersApi.transfer({ sender_id: user.id, receiver_id: form.receiver_id, amount: form.amount, description: form.description });
        toast.success('Kreds sent to user!');
      } else {
        await usersApi.transferToOrg({ org_id: form.org_id, amount: form.amount, description: form.description });
        toast.success('Kreds sent to organization!');
      }
      setForm({ receiver_id: '', org_id: '', amount: '', description: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in flex flex-col items-center">
      <div className="w-full max-w-lg">
        <h1 className="font-mono text-2xl font-bold text-white">Transfer Kreds</h1>
        <p className="text-muted text-sm mt-1">Send kreds to another user or a partnered organization</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="k-card p-6 space-y-5">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode('user')}
              className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'user' ? 'border-accent bg-accent/10 text-accent' : 'border-bdr text-muted hover:border-accent/40'}`}>
              <Send size={14} /> To User
            </button>
            <button type="button" onClick={() => setMode('org')}
              className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'org' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-bdr text-muted hover:border-cyan-400/40'}`}>
              <Building2 size={14} /> To Organization
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'user' ? (
              <div>
                <label className="k-label">Recipient User <span className="text-danger">*</span></label>
                <select className="k-input" required value={form.receiver_id} onChange={e => setForm(p => ({ ...p, receiver_id: e.target.value }))}>
                  <option value="">Select user…</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.username} (⚡ {parseFloat(u.balance || 0).toLocaleString()})</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="k-label">Partnered Organization <span className="text-danger">*</span></label>
                <select className="k-input" required value={form.org_id} onChange={e => setForm(p => ({ ...p, org_id: e.target.value }))}>
                  <option value="">Select organization…</option>
                  {orgs.map(o => <option key={o.org_id} value={o.org_id}>{o.display_name || o.delegate || 'Unnamed'} — {o.services || 'No services'}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="k-label">Amount (Kreds) <span className="text-danger">*</span></label>
              <input className="k-input font-mono" type="number" min="0.01" step="0.01" required placeholder="100.00"
                value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className="k-label">Description</label>
              <input className="k-input" placeholder={mode === 'user' ? 'Payment for favour…' : 'Healthcare services…'}
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <button type="submit" disabled={submitting || loading} className="k-btn-primary w-full justify-center py-2.5 flex items-center gap-2">
              <Send size={14} /> {submitting ? 'Sending…' : 'Send Kreds'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}