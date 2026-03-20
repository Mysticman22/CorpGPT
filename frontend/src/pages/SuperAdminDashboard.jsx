import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ShieldCheck, Clock, Activity, LogOut,
  UserCheck, UserMinus, RefreshCw, Search, Terminal, Crown,
  Shield, AlertTriangle, Check, X, ChevronRight, LayoutDashboard, ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import { authService } from '../api/authService';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [metrics, setMetrics]     = useState(null);
  const [users, setUsers]         = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, usersRes, auditRes] = await Promise.all([
        authService.getAdminMetrics(),
        authService.getAdminUsers({ page_size: 50 }),
        authService.getAuditLogs({ page_size: 30 }),
      ]);
      setMetrics(metricsRes);
      setUsers(usersRes.users || []);
      setAuditLogs(auditRes || []);
    } catch (err) {
      if (err.response?.status === 403) { 
        toast.error('Session expired or unauthorized.'); 
        logout(); 
        navigate('/super-admin/login'); 
      }
      else toast.error('Failed to sync system data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const userAction = async (userId, action, extra = {}) => {
    setActionLoading(userId + action);
    try {
      const actions = {
        approve:  () => authService.approveUser(userId),
        reject:   () => authService.rejectUser(userId, extra.reason),
        suspend:  () => authService.suspendUser(userId),
        activate: () => authService.activateUser(userId),
        role:     () => authService.updateUserRole(userId, extra.role),
      };
      await actions[action]();
      toast.success(`Protocol executed successfully.`);
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.detail || 'Handshake failed.'); 
    } finally { setActionLoading(null); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const filteredUsers = users.filter(u => {
    const m = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const s = !statusFilter || u.status === statusFilter;
    return m && s;
  });

  const statusThemes = {
    ACTIVE: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: UserCheck },
    PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
    SUSPENDED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: UserMinus }
  };

  const roleColors = { 
    SUPER_ADMIN: '#c084fc', 
    DEPARTMENT_ADMIN: '#818cf8', 
    MANAGER: '#60a5fa', 
    EMPLOYEE: '#94a3b8' 
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1000px] ml-0 p-4 sm:p-6 lg:p-8">
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#0b0e14]/80">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Go Back"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="size-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tighter text-white">NEXUS</span>
                <span className="text-[10px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Core</span>
              </div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] -mt-1 opacity-80">Super Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3 group cursor-default">
              <div className="text-right">
                <p className="text-sm font-bold text-white leading-none">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">System Authority</p>
              </div>
              <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/10 text-sm font-black text-white shadow-lg">
                {user?.email?.[0]?.toUpperCase()}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
            >
              <LogOut size={14} /> Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-slate-400 text-xs mt-1">Unified organizational oversight and protocol management.</p>
        </motion.div>

        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-white">
          <KPIBlock label="Total Operators" value={metrics?.total_users} icon={Users} color="#818cf8" loading={loading} />
          <KPIBlock label="Active Access" value={metrics?.active_users} icon={UserCheck} color="#10b981" loading={loading} />
          <KPIBlock label="Pending Approvals" value={metrics?.pending_users} icon={Clock} color="#f59e0b" loading={loading} />
          <KPIBlock label="Security Exclusions" value={metrics?.suspended_users} icon={UserMinus} color="#ef4444" loading={loading} />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
          <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="User Management" />
          <TabBtn active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={Terminal} label="System Audit" />
        </div>

        {/* ── Content Area ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' ? (
            <motion.div key="users" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search identity or network address..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-xs focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
                <select 
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer pr-10 min-w-40"
                >
                  <option value="" className="bg-[#0b0e14]">All Protocols</option>
                  <option value="ACTIVE" className="bg-[#0b0e14]">Active</option>
                  <option value="PENDING" className="bg-[#0b0e14]">Pending</option>
                  <option value="SUSPENDED" className="bg-[#0b0e14]">Suspended</option>
                </select>
              </div>

              <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Identity</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Sector</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Clearance</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Directives</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <LoadingRow colSpan={5} />
                    ) : filteredUsers.length === 0 ? (
                      <EmptyRow colSpan={5} message="No matched identities found in sector database." />
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="size-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-inner"
                              style={{ background: `${roleColors[u.role] || '#94a3b8'}20`, color: roleColors[u.role] }}
                            >
                              {u.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{u.full_name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[10px] font-medium text-slate-400">{u.department?.name || 'GENERIC'}</td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-sm border" style={{ borderColor: `${roleColors[u.role] || '#94a3b8'}40`, color: roleColors[u.role], backgroundColor: `${roleColors[u.role] || '#94a3b8'}10` }}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {(() => {
                            const theme = statusThemes[u.status] || statusThemes.PENDING;
                            const Icon = theme.icon;
                            return (
                              <div className="flex items-center gap-2" style={{ color: theme.color }}>
                                <Icon size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{u.status}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            {u.status === 'PENDING' && (
                              <>
                                <ActionIcon color="#10b981" icon={Check} onClick={() => userAction(u.id, 'approve')} loading={actionLoading === u.id + 'approve'} />
                                <ActionIcon color="#ef4444" icon={X} onClick={() => userAction(u.id, 'reject')} loading={actionLoading === u.id + 'reject'} />
                              </>
                            )}
                            {u.status === 'ACTIVE' && u.role !== 'SUPER_ADMIN' && (
                              <ActionIcon color="#f59e0b" icon={ShieldOff} onClick={() => userAction(u.id, 'suspend')} loading={actionLoading === u.id + 'suspend'} />
                            )}
                            {u.status === 'SUSPENDED' && (
                              <ActionIcon color="#10b981" icon={Activity} onClick={() => userAction(u.id, 'activate')} loading={actionLoading === u.id + 'activate'} />
                            )}
                            {u.role !== 'SUPER_ADMIN' && u.role !== 'DEPARTMENT_ADMIN' && (
                              <ActionIcon color="#818cf8" icon={Crown} onClick={() => userAction(u.id, 'role', { role: 'DEPARTMENT_ADMIN' })} loading={actionLoading === u.id + 'role'} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div key="audit" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Operation</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Network Interface</th>
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {loading ? (
                      <LoadingRow colSpan={4} />
                    ) : auditLogs.length === 0 ? (
                      <EmptyRow colSpan={4} message="Security vault empty. No logged operations detected." />
                    ) : auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-black px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[10px] text-slate-400 max-w-sm truncate">{log.description}</td>
                        <td className="px-5 py-3 text-[10px] text-slate-500">{log.ip_address || '0.0.0.0'}</td>
                        <td className="px-5 py-3 text-[10px] text-slate-500 text-right">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
      `}</style>
      </div>
    </div>
  );
}

function KPIBlock({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="glass-panel p-5 relative overflow-hidden group hover:bg-white/[0.05] transition-all duration-500">
      <div className="absolute top-0 right-0 size-24 bg-gradient-to-br opacity-[0.05] blur-2xl group-hover:opacity-[0.1] transition-opacity duration-700" style={{ background: color }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-lg flex items-center justify-center p-1.5" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <div className="text-3xl font-black">{loading ? '—' : (value ?? 0)}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 shadow-indigo-900/40 border border-indigo-500/50' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function ActionIcon({ icon: Icon, color, onClick, loading }) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`size-8 rounded-lg flex items-center justify-center border transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
      style={{ borderColor: `${color}30`, backgroundColor: `${color}10`, color: color }}
    >
      {loading ? <RefreshCw size={14} className="animate-spin" /> : <Icon size={14} />}
    </button>
  );
}

function LoadingRow({ colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={32} className="text-indigo-500 animate-spin opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Synchronizing Database</p>
        </div>
      </td>
    </tr>
  );
}

function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-20 text-center">
        <div className="flex flex-col items-center gap-4 opacity-30">
          <Activity size={32} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{message}</p>
        </div>
      </td>
    </tr>
  );
}

function ShieldOff(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 2 20 20"/><path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7 10"/><path d="M12 2a1 1 0 0 0-1 1v1"/><path d="M17.9 12.1a1 1 0 0 0 .1-.1V6a1 1 0 0 0-1-1h-2a1 1 0 0 0-1-1V2"/>
    </svg>
  );
}
