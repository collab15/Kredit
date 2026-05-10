import { useState } from 'react';
import { Award, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgsApi } from '../../api/client';
import UserLookupInput from '../../components/UserLookupInput';

export default function OrgReward() {
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientUser,     setRecipientUser]     = useState(null);
  const [amount,     setAmount]     = useState('');
  const [desc,       setDesc]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReward = async (e) => {
    e.preventDefault();
    if (!recipientUser) { toast.error('Please enter a valid username'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await orgsApi.reward({ user_id: recipientUser.user_id, amount: amt, description: desc || undefined });
      toast.success(`⚡ ${amt.toLocaleString()} kreds sent to ${recipientUser.username}`);
      setRecipientUsername('');
      setRecipientUser(null);
      setAmount('');
      setDesc('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in flex flex-col items-center">
      <div className="w-full max-w-lg">
        <h1 className="font-mono text-2xl font-bold text-white">Send Kreds to User</h1>
        <p className="text-muted text-sm mt-1">As an agency, you can issue unlimited kreds to any registered user.</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="k-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-kred/10 flex items-center justify-center">
              <Award size={16} className="text-kred" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Issue Kreds</p>
              <p className="text-[10px] text-muted">
                {recipientUser ? `→ ${recipientUser.username}` : 'Enter a username to get started'}
              </p>
            </div>
          </div>

          <form onSubmit={handleReward} className="space-y-4">
            <div>
              <label className="k-label">Recipient Username <span className="text-danger">*</span></label>
              <UserLookupInput
                value={recipientUsername}
                onChange={setRecipientUsername}
                onResolved={setRecipientUser}
                placeholder="Enter username…"
                required
              />
            </div>
            <div>
              <label className="k-label">Amount (kreds) <span className="text-danger">*</span></label>
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
              disabled={submitting || !recipientUser}
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
