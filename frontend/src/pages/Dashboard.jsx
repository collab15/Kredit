import { useEffect, useState } from 'react';
import { Users, Building2, Handshake, Coins, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { transactionsApi, favoursApi } from '../api/client';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const TX_COLS = [
  { key: 'type',        label: 'Type',    render: (r) => (
    <span className={`k-badge ${r.type === 'reward' ? 'bg-kred/10 text-kred' : 'bg-accent/10 text-accent'}`}>
      {r.type}
    </span>
  )},
  { key: 'from_party',  label: 'From'   },
  { key: 'to_party',    label: 'To'     },
  { key: 'amount',      label: 'Amount', render: (r) => (
    <span className="font-mono text-kred">+{parseFloat(r.amount).toLocaleString()} ⚡</span>
  )},
  { key: 'time_stamp',  label: 'Time',   render: (r) => <span className="text-muted text-xs">{fmtTime(r.time_stamp)}</span> },
];

const FAVOUR_COLS = [
  { key: 'requestor',   label: 'Requestor'  },
  { key: 'requestee',   label: 'Requestee'  },
  { key: 'description', label: 'Description'},
  { key: 'status',      label: 'Status',    render: (r) => {
    const map = { completed: 'bg-kred/10 text-kred', pending: 'bg-warn/10 text-warn', open: 'bg-muted/10 text-muted' };
    return <span className={`k-badge ${map[r.status] || ''}`}>{r.status}</span>;
  }},
];

export default function Dashboard() {
  const [stats,    setStats]    = useState(null);
  const [txs,      setTxs]      = useState([]);
  const [favours,  setFavours]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      transactionsApi.getStats(),
      transactionsApi.getAll(),
      favoursApi.getAll(),
    ]).then(([s, t, f]) => {
      setStats(s.data);
      setTxs(t.data.slice(0, 6));
      setFavours(f.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Kredit network overview</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users"        value={stats?.total_users}        icon={Users}          iconBg="bg-cyan-500/10"  iconColor="text-cyan-400"  loading={loading} />
        <StatCard title="Organizations"      value={stats?.total_orgs}         icon={Building2}      iconBg="bg-violet-500/10" iconColor="text-violet-400" loading={loading} />
        <StatCard title="Favours"            value={stats?.total_favours}      icon={Handshake}      iconBg="bg-amber-500/10"  iconColor="text-amber-400" loading={loading} />
        <StatCard title="Kreds in Circulation" value={stats?.total_kreds}      icon={Coins}          iconBg="bg-green-500/10"  iconColor="text-green-400" suffix="⚡ " loading={loading} />
      </div>

      {/* ── Second row ── */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Transactions" value={stats?.total_transactions} icon={ArrowLeftRight} iconBg="bg-pink-500/10"   iconColor="text-pink-400"  loading={loading} />
        <div className="k-card p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <TrendingUp size={15} className="text-accent" />
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest">Avg. Balance</p>
            <p className="font-mono text-2xl font-bold text-white mt-1">
              {loading
                ? <span className="text-muted animate-pulse">—</span>
                : <>⚡ {stats?.total_users ? (stats.total_kreds / stats.total_users).toFixed(1) : '0'}</>
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="grid grid-cols-5 gap-6">
        {/* Transactions */}
        <div className="k-card col-span-3">
          <div className="px-5 py-4 border-b border-bdr flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <span className="text-[10px] text-muted font-mono uppercase">Latest 6</span>
          </div>
          <DataTable columns={TX_COLS} data={txs} loading={loading} emptyText="No transactions yet." />
        </div>

        {/* Favours */}
        <div className="k-card col-span-2">
          <div className="px-5 py-4 border-b border-bdr flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Favours</h2>
            <span className="text-[10px] text-muted font-mono uppercase">Latest 5</span>
          </div>
          <DataTable columns={FAVOUR_COLS} data={favours} loading={loading} emptyText="No favours yet." />
        </div>
      </div>
    </div>
  );
}