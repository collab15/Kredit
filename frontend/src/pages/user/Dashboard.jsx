import { useEffect, useState } from 'react';
import { Coins, ArrowLeftRight, Handshake, TrendingUp } from 'lucide-react';
import { transactionsApi, favoursApi, usersApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const TX_COLS = [
  { key: 'type',        label: 'Type',      render: (r) => {
    const cls = r.type === 'reward' ? 'bg-kred/10 text-kred' : r.type === 'org_payment' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-accent/10 text-accent';
    return <span className={`k-badge ${cls}`}>{r.type}</span>;
  }},
  { key: 'direction',   label: 'Direction', render: (r) => <span className={`text-xs font-medium ${r.direction === 'sent' ? 'text-danger' : 'text-kred'}`}>{r.direction}</span> },
  { key: 'counterpart', label: 'Party'  },
  { key: 'amount',      label: 'Amount',    render: (r) => <span className={`font-mono ${r.direction === 'sent' ? 'text-danger' : 'text-kred'}`}>{r.direction === 'sent' ? '-' : '+'}⚡ {parseFloat(r.amount).toLocaleString()}</span> },
  { key: 'time_stamp',  label: 'Time',      render: (r) => <span className="text-muted text-xs">{fmtTime(r.time_stamp)}</span> },
];

const FAVOUR_COLS = [
  { key: 'requestor',   label: 'Requestor'  },
  { key: 'requestee',   label: 'Requestee'  },
  { key: 'description', label: 'Description'},
  { key: 'status',      label: 'Status', render: (r) => {
    const map = { completed: 'bg-kred/10 text-kred', pending: 'bg-warn/10 text-warn', open: 'bg-muted/10 text-muted' };
    return <span className={`k-badge ${map[r.status] || ''}`}>{r.status}</span>;
  }},
];

export default function UserDashboard() {
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [txs,     setTxs]     = useState([]);
  const [favours, setFavours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([transactionsApi.getStats(), usersApi.getTransactions(user.id), favoursApi.getAll()])
      .then(([s, t, f]) => { setStats(s.data); setTxs(t.data.slice(0, 6)); setFavours(f.data.slice(0, 5)); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">Welcome, {user?.username}</h1>
        <p className="text-muted text-sm mt-1">Your personal Kredit dashboard</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Your Balance"      value={stats?.balance}            icon={Coins}          iconBg="bg-green-500/10"  iconColor="text-green-400"  loading={loading} suffix="⚡ " />
        <StatCard title="Transactions"      value={stats?.total_transactions} icon={ArrowLeftRight} iconBg="bg-pink-500/10"   iconColor="text-pink-400"   loading={loading} />
        <StatCard title="Favours"           value={stats?.total_favours}      icon={Handshake}      iconBg="bg-amber-500/10"  iconColor="text-amber-400"  loading={loading} />
        <div className="k-card p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><TrendingUp size={15} className="text-accent" /></div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest">Avg Tx Size</p>
            <p className="font-mono text-2xl font-bold text-white mt-1">
              {loading ? <span className="text-muted animate-pulse">—</span>
                : <>⚡ {stats?.total_transactions ? ((stats?.balance || 0) / stats.total_transactions).toFixed(1) : '0'}</>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="k-card col-span-3">
          <div className="px-5 py-4 border-b border-bdr flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <span className="text-[10px] text-muted font-mono uppercase">Latest 6</span>
          </div>
          <DataTable columns={TX_COLS} data={txs} loading={loading} emptyText="No transactions yet." />
        </div>
        <div className="k-card col-span-2">
          <div className="px-5 py-4 border-b border-bdr flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">My Favours</h2>
            <span className="text-[10px] text-muted font-mono uppercase">Latest 5</span>
          </div>
          <DataTable columns={FAVOUR_COLS} data={favours} loading={loading} emptyText="No favours yet." />
        </div>
      </div>
    </div>
  );
}
