import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Crown
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDeptAdmin  = user?.role === 'DEPARTMENT_ADMIN';
  const isAnyAdmin   = isSuperAdmin || isDeptAdmin;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/chat', label: 'Enterprise Search', icon: MessageSquare },
    ...(isAnyAdmin ? [{
      path: '/admin',
      label: isSuperAdmin ? 'Full Admin Panel' : 'Admin Panel',
      icon: Shield
    }] : []),
    ...(isSuperAdmin ? [{
      path: '/super-admin',
      label: 'Super Admin Console',
      icon: Crown,
      highlight: true,
    }] : []),
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="glass border-r border-[var(--border-color)] flex flex-col" style={{ width: '14rem', flexShrink: 0 }}>
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold gradient-text" style={{ fontSize: '1.25rem', lineHeight: 1.1 }}>NEXUS</h1>
              <p className="text-[var(--text-tertiary)]" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>Enterprise Search</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group relative flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${active
                    ? item.highlight
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg'
                    : item.highlight
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <Icon size={18} />
                <span className="font-bold" style={{ fontSize: '0.75rem' }}>{item.label}</span>
                {item.highlight && !active && (
                  <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.15)', color: '#f87171', marginLeft: 'auto' }}>SA</span>
                )}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-5"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <ChevronRight size={18} />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="glass-light rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex-center text-white font-bold text-lg"
                style={{ background: isSuperAdmin ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : isDeptAdmin ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--text-primary)] truncate" style={{ fontSize: '1.35rem' }}>
                  {user?.email}
                </p>
                <p className="capitalize mt-2 font-semibold" style={{ fontSize: '1.1rem', color: isSuperAdmin ? '#f87171' : isDeptAdmin ? '#fb923c' : 'var(--text-tertiary)' }}>
                  {isSuperAdmin ? '👑 Super Admin' : isDeptAdmin ? '🛡️ Dept Admin' : user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="
              flex items-center gap-3 w-full px-4 py-3 rounded-lg
              text-[var(--text-secondary)]
              hover:bg-red-500/10 hover:text-red-400
              transition-all
            "
          >
            <LogOut size={18} />
            <span className="font-bold" style={{ fontSize: '0.75rem' }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[var(--bg-primary)]">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
