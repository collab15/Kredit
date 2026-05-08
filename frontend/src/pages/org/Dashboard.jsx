import { useEffect, useState } from 'react';
import { ArrowLeftRight, Award, Building2, Users } from 'lucide-react';
import { transactionsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const TX_COLS = [
  { key: 'type',       label: 'Type',   render: (r) => {
    const cls = r.type === 'reward' ? 'bg-kred/10 text-kred' : r.type === 'org_payment' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-accent/10 text-accent';
    return <span className={`k-badge ${cls}`}>{r.type}</span>;
  }},
  { key: 'from_party', label: 'From' },
  { key: 'to_party',   label: 'To'   },
  { key: 'amount',     label: 'Amount', render: (r) => <span className="font-mono text-kred">⚡ {parseFloat(r.amount).toLocaleString()}</span> },
  { key: 'time_stamp', label: 'Time',   render: (r) => <span className="text-muted text-xs">{fmtTime(r.time_stamp)}</span> },
];

export default function OrgDashboard() {
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);

  const isAgency = user?.org_type === 'agency';

  useEffect(() => {
    Promise.all([transactionsApi.getStats(), transactionsApi.getAll()])
      .then(([s, t]) => { setStats(s.data); setTxs(t.data.slice(0, 8)); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">Welcome, {user?.name}</h1>
        <p className="text-muted text-sm mt-1 flex items-center gap-2">
          <span className={`k-badge ${isAgency ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{user?.org_type}</span>
          organization portal
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isAgency ? (
          <>
            <StatCard
              title="Users Rewarded (Total Rewards)"
              value={stats?.total_rewards}
              icon={Users}
              iconBg="bg-kred/10"
              iconColor="text-kred"
              loading={loading}
            />
            <div className="k-card p-5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Building2 size={15} className="text-violet-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest">Agency Type</p>
                <p className="font-mono text-lg font-bold text-violet-400 mt-1">Unlimited Kreds</p>
                <p className="text-[10px] text-muted mt-0.5">Agencies issue kreds freely to users</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <StatCard
              title="Payments Received (Total)"
              value={stats?.total_payments}
              icon={ArrowLeftRight}
              iconBg="bg-cyan-500/10"
              iconColor="text-cyan-400"
              loading={loading}
            />
            <div className="k-card p-5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Award size={15} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest">Partner Type</p>
                <p className="font-mono text-lg font-bold text-cyan-400 mt-1">Accepting Kreds</p>
                <p className="text-[10px] text-muted mt-0.5">Users pay you with their kred balance</p>
              </div>
            </div>
          </>
        )}
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
