import { useEffect, useState } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
import { usersApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function UserTransactions() {
  const { user }  = useAuth();
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    usersApi.getTransactions(user.id).then(r => setTxs(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = search ? txs.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : txs;
  const received = txs.filter(t => t.direction === 'received').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const sent     = txs.filter(t => t.direction === 'sent').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const columns = [
    { key: 'type',        label: 'Type',      render: (r) => {
      const cls = r.type === 'reward' ? 'bg-kred/10 text-kred' : r.type === 'org_payment' ? 'bg-orange-100 text-orange-600' : 'bg-accent/10 text-accent';
      return <span className={`k-badge ${cls}`}>{r.type?.replace('_', ' ')}</span>;
    }},
    { key: 'direction',   label: 'Direction', render: (r) => (
      <div className={`flex items-center gap-1 text-xs font-medium ${r.direction === 'sent' ? 'text-danger' : 'text-kred'}`}>
        {r.direction === 'sent' ? <TrendingDown size={12} /> : <TrendingUp size={12} />} {r.direction}
      </div>
    )},
    { key: 'counterpart', label: 'Party'   },
    { key: 'amount',      label: 'Amount',    render: (r) => (
      <span className={`font-mono font-bold ${r.direction === 'sent' ? 'text-danger' : 'text-kred'}`}>
        {r.direction === 'sent' ? '-' : '+'}⚡ {parseFloat(r.amount).toLocaleString()}
      </span>
    )},
    { key: 'description', label: 'Note',      render: (r) => r.description ? <span className="text-xs text-muted">{r.description}</span> : <span className="text-muted">—</span> },
    { key: 'time_stamp',  label: 'Time',      render: (r) => <span className="text-xs text-muted">{fmtTime(r.time_stamp)}</span> },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold">My Transactions</h1>
        <p className="text-muted text-sm mt-1">Your complete kred history</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Received', value: received,         color: 'text-kred',   bg: 'bg-kred/10',   icon: TrendingUp   },
          { label: 'Total Sent',     value: sent,             color: 'text-danger',  bg: 'bg-danger/10', icon: TrendingDown },
          { label: 'Net Flow',       value: received - sent,  color: received >= sent ? 'text-kred' : 'text-danger', bg: 'bg-accent/10', icon: ArrowLeftRight },
        ].map(s => (
          <div key={s.label} className="k-card p-5 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}><s.icon size={15} className={s.color} /></div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest">{s.label}</p>
              <p className={`font-mono text-xl font-bold ${s.color} mt-0.5`}>
                {loading ? <span className="animate-pulse text-muted">—</span> : `⚡ ${Math.abs(s.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted text-sm">{filtered.length} transactions</p>
        <input className="k-input w-52 text-xs" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="k-card">
        <DataTable columns={columns} data={filtered} loading={loading} emptyText="No transactions yet." />
      </div>
    </div>
  );
}
