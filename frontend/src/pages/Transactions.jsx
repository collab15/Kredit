import { useEffect, useState } from 'react';
import { ArrowLeftRight, Users, Award, TrendingUp } from 'lucide-react';
import { transactionsApi } from '../api/client';
import DataTable from '../components/DataTable';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

export default function Transactions() {
  const [all,        setAll]     = useState([]);
  const [peer,       setPeer]    = useState([]);
  const [rewards,    setRewards] = useState([]);
  const [stats,      setStats]   = useState(null);
  const [loading,    setLoading] = useState(true);
  const [tab,        setTab]     = useState('all');
  const [search,     setSearch]  = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      transactionsApi.getAll(),
      transactionsApi.getPeer(),
      transactionsApi.getRewards(),
      transactionsApi.getStats(),
    ]).then(([a, p, r, s]) => {
      setAll(a.data);
      setPeer(p.data);
      setRewards(r.data);
      setStats(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const DATA_MAP = { all, peer, rewards };
  const raw = DATA_MAP[tab] || [];

  const filtered = search
    ? raw.filter(r =>
        JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
      )
    : raw;

  // ── Column definitions per tab ──────────────────────────────────────────
  const ALL_COLS = [
    { key: 'type',        label: 'Type',    render: (r) => (
      <span className={`k-badge ${r.type === 'reward' ? 'bg-kred/10 text-kred' : 'bg-accent/10 text-accent'}`}>
        {r.type === 'reward' ? '⚡ reward' : '↔ peer'}
      </span>
    )},
    { key: 'from_party',  label: 'From',    render: (r) => <span className="font-mono text-sm">{r.from_party}</span> },
    { key: 'to_party',    label: 'To',      render: (r) => <span className="font-mono text-sm">{r.to_party}</span>   },
    { key: 'amount',      label: 'Amount',  render: (r) => (
      <span className="font-mono font-bold text-kred">⚡ {parseFloat(r.amount).toLocaleString()}</span>
    )},
    { key: 'description', label: 'Note',    render: (r) =>
      r.description ? <span className="text-xs text-slate-400">{r.description}</span> : <span className="text-muted">—</span>
    },
    { key: 'time_stamp',  label: 'Time',    render: (r) => <span className="text-xs text-muted">{fmtTime(r.time_stamp)}</span> },
  ];

  const PEER_COLS = [
    { key: 'sender',      label: 'Sender',   render: (r) => <span className="font-mono text-white">{r.sender}</span>   },
    { key: 'receiver',    label: 'Receiver', render: (r) => <span className="font-mono text-slate-300">{r.receiver}</span> },
    { key: 'amount',      label: 'Kreds',    render: (r) => (
      <span className="font-mono font-bold text-accent">⚡ {parseFloat(r.amount).toLocaleString()}</span>
    )},
    { key: 'description', label: 'Note',     render: (r) =>
      r.description ? <span className="text-xs text-slate-400">{r.description}</span> : <span className="text-muted">—</span>
    },
    { key: 'time_stamp',  label: 'Time',     render: (r) => <span className="text-xs text-muted">{fmtTime(r.time_stamp)}</span> },
  ];

  const REWARD_COLS = [
    { key: 'rewarded_user', label: 'User',         render: (r) => <span className="font-mono text-white">{r.rewarded_user}</span>  },
    { key: 'agency_scope',  label: 'Agency Scope', render: (r) => r.agency_scope || <span className="text-muted">—</span> },
    { key: 'amount',        label: 'Kreds',        render: (r) => (
      <span className="font-mono font-bold text-kred">⚡ {parseFloat(r.amount).toLocaleString()}</span>
    )},
    { key: 'description',   label: 'Note',         render: (r) =>
      r.description ? <span className="text-xs text-slate-400">{r.description}</span> : <span className="text-muted">—</span>
    },
    { key: 'time_stamp',    label: 'Time',         render: (r) => <span className="text-xs text-muted">{fmtTime(r.time_stamp)}</span> },
  ];

  const COLS_MAP = { all: ALL_COLS, peer: PEER_COLS, rewards: REWARD_COLS };

  const TABS = [
    { key: 'all',     label: 'All Transactions', icon: ArrowLeftRight, count: all.length     },
    { key: 'peer',    label: 'Peer Transfers',   icon: Users,          count: peer.length    },
    { key: 'rewards', label: 'Agency Rewards',   icon: Award,          count: rewards.length },
  ];

  // ── Volume stat from all transactions ──────────────────────────────────
  const totalVolume = all.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const rewardVolume = rewards.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const peerVolume   = peer.reduce((sum, t)    => sum + parseFloat(t.amount || 0), 0);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-white">Transactions</h1>
        <p className="text-muted text-sm mt-1">Full ledger of all kred movements</p>
      </div>

      {/* Volume Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Volume',  value: totalVolume,  icon: TrendingUp,     color: 'text-white',   bg: 'bg-accent/10',  icon_c: 'text-accent'  },
          { label: 'Peer Volume',   value: peerVolume,   icon: Users,          color: 'text-accent',  bg: 'bg-accent/10',  icon_c: 'text-accent'  },
          { label: 'Reward Volume', value: rewardVolume, icon: Award,          color: 'text-kred',    bg: 'bg-kred/10',    icon_c: 'text-kred'    },
        ].map(s => (
          <div key={s.label} className="k-card p-5 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={15} className={s.icon_c} />
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest">{s.label}</p>
              <p className={`font-mono text-xl font-bold ${s.color} mt-0.5`}>
                {loading ? <span className="animate-pulse text-muted">—</span> : `⚡ ${s.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between border-b border-bdr">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm transition-all relative flex items-center gap-2 ${
                tab === t.key ? 'text-accent font-medium' : 'text-muted hover:text-slate-300'
              }`}
            >
              <t.icon size={13} />
              {t.label}
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                tab === t.key ? 'bg-accent/10 text-accent' : 'bg-surface2 text-muted'
              }`}>
                {t.count}
              </span>
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-px bg-accent" />}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          className="k-input w-56 text-xs mb-1"
          placeholder="Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="k-card">
        {filtered.length > 0 && !loading && (
          <div className="px-5 py-3 border-b border-bdr flex items-center justify-between">
            <span className="text-[10px] text-muted font-mono uppercase">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-muted font-mono">
              Total: ⚡ {filtered.reduce((s, r) => s + parseFloat(r.amount || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <DataTable
          columns={COLS_MAP[tab]}
          data={filtered}
          loading={loading}
          emptyText={search ? 'No matching transactions.' : 'No transactions yet.'}
        />
      </div>
    </div>
  );
}