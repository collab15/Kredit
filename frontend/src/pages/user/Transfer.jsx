import { useEffect, useState } from 'react';
import { Send, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi, orgsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import UserLookupInput from '../../components/UserLookupInput';

export default function UserTransfer() {
  const { user }  = useAuth();
  const [orgs,         setOrgs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [mode,         setMode]         = useState('user');
  const [receiverName, setReceiverName] = useState('');
  const [receiverUser, setReceiverUser] = useState(null);
  const [orgQuery,     setOrgQuery]     = useState('');
  const [selectedOrg,  setSelectedOrg]  = useState(null);
  const [amount,       setAmount]       = useState('');
  const [description,  setDescription]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    orgsApi.getPartnered()
      .then(r => setOrgs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const matchingOrgs = orgQuery.length >= 1
    ? orgs.filter(o => (o.display_name || o.delegate || '').toLowerCase().includes(orgQuery.toLowerCase()))
    : orgs;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'user' && !receiverUser) { toast.error('Please enter a valid username'); return; }
    if (mode === 'org' && !selectedOrg)  { toast.error('Please select an organization'); return; }
    setSubmitting(true);
    try {
      if (mode === 'user') {
        await usersApi.transfer({ sender_id: user.id, receiver_id: receiverUser.user_id, amount, description });
        toast.success('Kreds sent!');
        setReceiverName(''); setReceiverUser(null);
      } else {
        await usersApi.transferToOrg({ org_id: selectedOrg.org_id, amount, description });
        toast.success('Kreds sent to organization!');
        setOrgQuery(''); setSelectedOrg(null);
      }
      setAmount(''); setDescription('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in flex flex-col items-center">
      <div className="w-full max-w-lg">
        <h1 className="font-mono text-2xl font-bold">Transfer Kreds</h1>
        <p className="text-muted text-sm mt-1">Send kreds to another user or a partnered organization</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="k-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode('user')}
              className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'user' ? 'border-accent bg-accent/10 text-accent' : 'border-bdr text-muted hover:border-accent/40'}`}>
              <Send size={14} /> To User
            </button>
            <button type="button" onClick={() => setMode('org')}
              className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'org' ? 'border-kred bg-kred/10 text-kred' : 'border-bdr text-muted hover:border-kred/40'}`}>
              <Building2 size={14} /> To Organization
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'user' ? (
              <div>
                <label className="k-label">Recipient Username <span className="text-danger">*</span></label>
                <UserLookupInput
                  value={receiverName}
                  onChange={setReceiverName}
                  onResolved={setReceiverUser}
                  excludeId={user.id}
                  placeholder="e.g. alice"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="k-label">Partnered Organization <span className="text-danger">*</span></label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <input className="k-input" placeholder="Search organization name…"
                      value={orgQuery} onChange={e => { setOrgQuery(e.target.value); setSelectedOrg(null); }} />
                    {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                  </div>
                  {orgQuery && !selectedOrg && (
                    <div className="border border-bdr rounded-xl overflow-hidden max-h-36 overflow-y-auto bg-white/90 backdrop-blur">
                      {matchingOrgs.length === 0 ? (
                        <p className="text-xs text-muted text-center py-3">No organizations found</p>
                      ) : matchingOrgs.map(o => (
                        <button key={o.org_id} type="button"
                          onClick={() => { setSelectedOrg(o); setOrgQuery(o.display_name || o.delegate || 'Unnamed'); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent/8 transition-colors border-b border-bdr/50 last:border-0">
                          <span className="font-medium">{o.display_name || o.delegate || 'Unnamed'}</span>
                          {o.services && <span className="text-muted ml-2 text-xs">{o.services}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedOrg && (
                    <p className="text-xs text-kred mt-1 ml-1 font-medium">
                      ✓ {selectedOrg.display_name || selectedOrg.delegate}
                      {selectedOrg.services ? ` — ${selectedOrg.services}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="k-label">Amount (Kreds) <span className="text-danger">*</span></label>
              <input className="k-input font-mono" type="number" min="0.01" step="0.01" required placeholder="100.00"
                value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="k-label">Description</label>
              <input className="k-input" placeholder={mode === 'user' ? 'Payment for favour…' : 'Healthcare services…'}
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <button type="submit" disabled={submitting} className="k-btn-primary w-full justify-center py-2.5 flex items-center gap-2">
              <Send size={14} /> {submitting ? 'Sending…' : 'Send Kreds'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
