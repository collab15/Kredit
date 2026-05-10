import { useEffect, useState } from 'react';
import { Award, ArrowLeftRight } from 'lucide-react';
import { transactionsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function OrgTransactions() {
  const { user }  = useAuth();
  const isAgency  = user?.org_type === 'agency';
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    const fn = isAgency ? transactionsApi.getRewards : transactionsApi.getOrgPayments;
    fn().then(r => setTxs(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = search ? txs.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : txs;
  const totalVol = txs.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const REWARD_COLS = [
    { key: 'rewarded_user', label: 'User',   render: (r) => <span className="font-mono font-medium">{r.rewarded_user}</span> },
    { key: 'agency_name',   label: 'Agency', render: (r) => <span className="font-medium text-kred">{r.agency_name || '—'}</span> },
    { key: 'amount',        label: 'Kreds',  render: (r) => <span className="font-mono font-bold text-kred">⚡ {parseFloat(r.amount).toLocaleString()}</span> },
    { key: 'description',   label: 'Note',   render: (r) => r.description ? <span className="text-xs text-muted">{r.description}</span> : <span className="text-muted">—</span> },
    { key: 'time_stamp',    label: 'Time',   render: (r) => <span className="text-xs text-muted">{fmtTime(r.time_stamp)}</span> },
  ];

  const PAY_COLS = [
    { key: 'payer',       label: 'Paid By',      render: (r) => <span className="font-mono font-medium">{r.payer}</span> },
    { key: 'org_name',    label: 'Organization', render: (r) => <span className="font-medium text-kred">{r.org_name || '—'}</span> },
    { key: 'amount',      label: 'Kreds',        render: (r) => <span className="font-mono font-bold text-kred">⚡ {parseFloat(r.amount).toLocaleString()}</span> },
    { key: 'description', label: 'Note',         render: (r) => r.description ? <span className="text-xs text-muted">{r.description}</span> : <span className="text-muted">—</span> },
    { key: 'time_stamp',  label: 'Time',         render: (r) => <span className="text-xs text-muted">{fmtTime(r.time_stamp)}</span> },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold">{isAgency ? 'Rewards Issued' : 'Payments Received'}</h1>
        <p className="text-muted text-sm mt-1">⚡ {totalVol.toLocaleString(undefined, { maximumFractionDigits: 2 })} total kreds</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted text-sm">{filtered.length} records</p>
        <input className="k-input w-52 text-xs" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="k-card">
        <DataTable columns={isAgency ? REWARD_COLS : PAY_COLS} data={filtered} loading={loading} emptyText="No transactions yet." />
      </div>
    </div>
  );
}
