import { useEffect, useState } from 'react';
import { Coins, ArrowLeftRight, Award, Building2 } from 'lucide-react';
import { transactionsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const TX_COLS = [
  { key: 'type',        label: 'Type',   render: (r) => {
    const cls = r.type === 'reward' ? 'bg-kred/10 text-kred' : r.type === 'org_payment' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-accent/10 text-accent';
    return <span className={`k-badge ${cls}`}>{r.type}</span>;
  }},
  { key: 'from_party',  label: 'From' },
  { key: 'to_party',    label: 'To'   },
  { key: 'amount',      label: 'Amount', render: (r) => <span className="font-mono text-kred">⚡ {parseFloat(r.amount).toLocaleString()}</span> },
  { key: 'time_stamp',  label: 'Time',   render: (r) => <span className="text-muted text-xs">{fmtTime(r.time_stamp)}</span> },
];

export default function OrgDashboard() {
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([transactionsApi.getStats(), transactionsApi.getAll()])
      .then(([s, t]) => { setStats(s.data); setTxs(t.data.slice(0, 8)); })
      .finally(() => setLoading(false));
  }, []);

  const isAgency = user?.org_type === 'agency';

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">Welcome, {user?.name}</h1>
        <p className="text-muted text-sm mt-1">
          <span className={`k-badge ${isAgency ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{user?.org_type}</span>
          {' '}organization portal
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Kred Balance"          value={stats?.balance}        icon={Coins}          iconBg="bg-green-500/10"   iconColor="text-green-400"   loading={loading} suffix="⚡ " />
        {isAgency
          ? <StatCard title="Users Rewarded"    value={stats?.total_rewards}  icon={Award}          iconBg="bg-kred/10"        iconColor="text-kred"        loading={loading} />
          : <StatCard title="Payments Received" value={stats?.total_payments} icon={ArrowLeftRight} iconBg="bg-cyan-500/10"    iconColor="text-cyan-400"    loading={loading} />
        }
        <StatCard title="Org Type"              value={user?.org_type}        icon={Building2}      iconBg="bg-violet-500/10"  iconColor="text-violet-400"  loading={false} />
      </div>

      <div className="k-card">
        <div className="px-5 py-4 border-b border-bdr flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          <span className="text-[10px] text-muted font-mono uppercase">Latest 8</span>
        </div>
        <DataTable columns={TX_COLS} data={txs} loading={loading} emptyText="No transactions yet." />
      </div>
    </div>
  );
}
