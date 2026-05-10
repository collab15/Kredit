import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Handshake,
  ArrowLeftRight, Zap, LogOut, Send, UserCircle, Award, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ADMIN_NAV = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/admin/admins',        icon: ShieldCheck,     label: 'Admins'       },
  { to: '/admin/users',         icon: Users,           label: 'Users'        },
  { to: '/admin/organizations', icon: Building2,       label: 'Organizations'},
  { to: '/admin/favours',       icon: Handshake,       label: 'Favours'      },
  { to: '/admin/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
];

const USER_NAV = [
  { to: '/user',              icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/user/favours',      icon: Handshake,       label: 'Favours'     },
  { to: '/user/transactions', icon: ArrowLeftRight,  label: 'Transactions'},
  { to: '/user/transfer',     icon: Send,            label: 'Transfer'    },
  { to: '/user/profile',      icon: UserCircle,      label: 'Profile'     },
];

const ORG_BASE_NAV = [
  { to: '/org',              icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/org/transactions', icon: ArrowLeftRight,  label: 'Transactions'},
  { to: '/org/profile',      icon: Building2,       label: 'Profile'     },
];

const ORG_AGENCY_NAV = [
  { to: '/org',              icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/org/reward',       icon: Award,           label: 'Send Kreds'  },
  { to: '/org/transactions', icon: ArrowLeftRight,  label: 'Transactions'},
  { to: '/org/profile',      icon: Building2,       label: 'Profile'     },
];

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const orgNav = user?.org_type === 'agency' ? ORG_AGENCY_NAV : ORG_BASE_NAV;
  const nav = user?.role === 'admin' ? ADMIN_NAV
            : user?.role === 'org'   ? orgNav
            : USER_NAV;

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = user?.role === 'admin' ? 'text-violet-600'
                  : user?.role === 'org'   ? 'text-kred'
                  : 'text-accent';

  return (
    <header className="k-navbar sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-accent">
            <Zap size={18} className="fill-white text-white" />
          </div>
          <div>
            <p className="font-mono font-bold tracking-[0.25em] text-sm">KREDIT</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Welfare Exchange Network</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === '/user' || to === '/org'}
              className={({ isActive }) => `k-nav-item flex items-center gap-2 ${isActive ? 'k-nav-active' : ''}`}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <div className="text-right">
              <p className={`text-xs font-mono font-bold ${roleColor}`}>
                {user?.username || user?.name || 'Unknown'}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>

      </div>
    </header>
  );
}
