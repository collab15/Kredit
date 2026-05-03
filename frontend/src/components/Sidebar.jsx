import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  ArrowLeftRight,
  Zap,
} from 'lucide-react';

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/users',         icon: Users,           label: 'Users'         },
  { to: '/organizations', icon: Building2,       label: 'Organizations' },
  { to: '/favours',       icon: Handshake,       label: 'Favours'       },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions'  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-surface border-r border-bdr flex flex-col z-20">
      {/* ── Logo ── */}
      <div className="p-5 border-b border-bdr">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center glow-accent shrink-0">
            <Zap size={18} className="text-bg fill-bg" />
          </div>
          <div>
            <p className="font-mono font-bold text-base leading-none tracking-widest text-white">KREDIT</p>
            <p className="text-[10px] text-muted mt-0.5 tracking-widest">KRED EXCHANGE</p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20 font-medium'
                  : 'text-muted hover:text-slate-200 hover:bg-surface2'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-accent' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-bdr space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-kred animate-pulse" />
          <span className="text-[10px] text-muted font-mono">API CONNECTED</span>
        </div>
        <p className="text-[10px] text-muted font-mono">v1.0.0 • CS-220 Project</p>
      </div>
    </aside>
  );
}