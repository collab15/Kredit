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
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users',         icon: Users,           label: 'Users' },
  { to: '/organizations', icon: Building2,       label: 'Organizations' },
  { to: '/favours',       icon: Handshake,       label: 'Favours' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
];

export default function Topbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center glow-accent">
            <Zap size={18} className="fill-black" />
          </div>

          <div>
            <p className="font-mono font-bold tracking-[0.25em] text-sm text-white">
              KREDIT
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
              Welfare Exchange Network
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white/5 text-white border border-white/10'
                    : 'text-muted hover:text-white hover:bg-white/[0.03]'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Status */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted font-mono">
            Bat and Co.
          </span>
        </div>

      </div>
    </header>
  );
}