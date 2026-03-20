import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Download, ShieldCheck, Users, AlertTriangle, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const API = 'http://localhost:8000/api/admin';

function apiFetch(path, opts = {}) {
  const token = useAuthStore.getState().token;
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  }).then(async r => {
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || r.statusText); }
    return r.json();
  });
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub }) {
  return (
    <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'clamp(6px, 0.6vw, 12px)', padding: 'clamp(10px, 1vw, 20px) clamp(11px, 1.2vw, 22px)', flex: 1, minWidth: 'clamp(80px, 8vw, 160px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'clamp(5px, 0.6vw, 12px)' }}>
        <span style={{ fontSize: 'clamp(6px, 0.6vw, 14px)', color: 'rgba(148,163,184,0.8)', fontWeight: 600 }}>{label}</span>
        <div style={{ width: 'clamp(14px, 1.6vw, 34px)', height: 'clamp(14px, 1.6vw, 34px)', borderRadius: 'clamp(4px, 0.4vw, 10px)', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon color={color} style={{ width: '50%', height: '50%' }} />
        </div>
      </div>
      <div style={{ fontSize: 'clamp(14px, 1.8vw, 32px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 'clamp(5px, 0.6vw, 12px)', color: 'rgba(148,163,184,0.6)', marginTop: 'clamp(2px, 0.3vw, 6px)' }}>{sub}</div>}
    </motion.div>
  );
}

const iconBtnStyle = { height: 'clamp(15px, 1.6vw, 34px)', width: 'auto', borderRadius: 'clamp(4px, 0.4vw, 8px)', border: '1px solid rgba(255,255,255,0.09)',
  background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 clamp(6px, 0.6vw, 13px)', gap: 'clamp(2px, 0.3vw, 6px)' };

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState({ user_growth: [], activity_logs: [] });

  useEffect(() => { 
    apiFetch('/metrics').then(setMetrics).catch(() => {}); 
    apiFetch('/dashboard/charts').then(setCharts).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 'clamp(10px, 1.2vw, 22px)', fontWeight: 900, color: '#fff', marginBottom: 'clamp(2px, 0.3vw, 6px)' }}>Executive Analytics</h2>
      <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 'clamp(6px, 0.7vw, 15px)', marginBottom: 'clamp(13px, 1.6vw, 34px)' }}>Security infrastructure and AI usage metrics</p>
      
      <div style={{ display: 'flex', gap: 'clamp(6px, 0.8vw, 16px)', flexWrap: 'wrap', marginBottom: 'clamp(13px, 1.6vw, 34px)' }}>
        <KpiCard label="Active Users"      value={metrics?.active_users}   icon={Users}       color="#4ade80" sub="Currently approved across all departments" />
        <KpiCard label="Super Admins"      value={metrics?.total_admins}   icon={ShieldCheck} color="#818cf8" sub="Global system administrators" />
        <KpiCard label="Pending Approvals" value={metrics?.pending_users}  icon={AlertTriangle}color="#fbbf24" sub="Users awaiting onboarding" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(10px, 1.2vw, 26px)' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'clamp(8px, 0.8vw, 18px)', padding: 'clamp(10px, 1.2vw, 26px)' }}>
          <h3 style={{ fontSize: 'clamp(6px, 0.8vw, 18px)', fontWeight: 700, color: '#e2e8f0', marginBottom: 'clamp(8px, 1vw, 22px)' }}>User Growth</h3>
          <div style={{ height: 'clamp(100px, 12vw, 260px)' }}>
            {charts.user_growth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.user_growth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: 'clamp(5px, 0.6vw, 10px)' }} tickMargin={15} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: 'clamp(5px, 0.6vw, 10px)' }} tickMargin={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                  <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ color: 'rgba(148,163,184,0.4)', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(6px, 0.6vw, 13px)' }}>No chart data</div>}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'clamp(8px, 0.8vw, 18px)', padding: 'clamp(10px, 1.2vw, 26px)' }}>
          <h3 style={{ fontSize: 'clamp(6px, 0.8vw, 18px)', fontWeight: 700, color: '#e2e8f0', marginBottom: 'clamp(8px, 1vw, 22px)' }}>Security Actions / Audit Velocity</h3>
          <div style={{ height: 'clamp(100px, 12vw, 260px)' }}>
            {charts.activity_logs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.activity_logs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: 'clamp(5px, 0.6vw, 10px)' }} tickMargin={15} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: 'clamp(5px, 0.6vw, 10px)' }} tickMargin={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ color: 'rgba(148,163,184,0.4)', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(6px, 0.6vw, 13px)' }}>No chart data</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AUDIT LOG TAB ─────────────────────────────────────────────────────────────
function AuditTab() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch(`/audit-logs?page_size=100`).then(setLogs).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const exportCsv = () => {
    const token = useAuthStore.getState().token;
    window.open(`${API}/audit-logs?export=true&Authorization=Bearer ${token}`, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px, 0.6vw, 12px)', marginBottom: 'clamp(10px, 1.2vw, 24px)', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 'clamp(9px, 1vw, 24px)', fontWeight: 800, color: '#fff', flex: 1 }}>Security Audit Trail</h2>
        <button onClick={exportCsv} style={{ ...iconBtnStyle, color: '#818cf8', borderColor: 'rgba(129,140,248,0.3)', fontSize: 'clamp(5px, 0.6vw, 13px)' }}>
          <Download style={{ width: 'clamp(6px, 0.6vw, 14px)', height: 'clamp(6px, 0.6vw, 14px)' }} /> Export CSV
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'clamp(6px, 0.8vw, 14px)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              {['Action', 'Entity', 'Description', 'IP', 'Time'].map(h => (
                <th key={h} style={{ padding: 'clamp(6px, 0.8vw, 16px) clamp(8px, 1vw, 20px)', color: 'rgba(148,163,184,0.7)',
                  fontWeight: 600, fontSize: 'clamp(5px, 0.6vw, 12px)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'clamp(16px, 2vw, 40px)', color: 'rgba(148,163,184,0.5)', fontSize: 'clamp(6px, 0.6vw, 14px)' }}>Loading secure logs…</td></tr>
              : logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: 'clamp(6px, 0.8vw, 16px) clamp(8px, 1vw, 20px)' }}>
                    <span style={{ fontSize: 'clamp(4px, 0.5vw, 11px)', fontWeight: 700, color: '#f43f5e', background: 'rgba(244,63,94,0.1)',
                      borderRadius: 'clamp(2px, 0.3vw, 6px)', padding: 'clamp(2px, 0.2vw, 5px) clamp(3px, 0.4vw, 8px)', whiteSpace: 'nowrap' }}>{l.action_type}</span>
                  </td>
                  <td style={{ padding: 'clamp(6px, 0.8vw, 16px) clamp(8px, 1vw, 20px)', color: 'rgba(148,163,184,0.7)', fontSize: 'clamp(5px, 0.6vw, 13px)' }}>{l.entity_type}</td>
                  <td style={{ padding: 'clamp(6px, 0.8vw, 16px) clamp(8px, 1vw, 20px)', color: '#cbd5e1', maxWidth: '30%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'clamp(5px, 0.6vw, 13px)' }}>{l.description}</td>
                  <td style={{ padding: 'clamp(6px, 0.8vw, 16px) clamp(8px, 1vw, 20px)', color: 'rgba(148,163,184,0.5)', fontSize: 'clamp(5px, 0.6vw, 12px)', fontFamily: 'monospace' }}>{l.ip_address || '—'}</td>
                  <td style={{ padding: 'clamp(6px, 0.8vw, 16px) clamp(8px, 1vw, 20px)', color: 'rgba(148,163,184,0.5)', fontSize: 'clamp(5px, 0.6vw, 12px)' }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MAIN AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const TABS = { overview: <OverviewTab />, audit: <AuditTab /> };
  
  const navTabs = [
    { id: 'overview', label: 'Executive Metrics', icon: LayoutDashboard },
    { id: 'audit',    label: 'Global Audit Trail', icon: FileText }
  ];

  return (
    <div style={{ display: 'flex', height: '100vw', fontFamily: "'Inter', sans-serif", background: '#050a14', minHeight: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <div style={{ width: 'clamp(104px, 8.8vw, 220px)', flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(13px, 1.6vw, 32px) 0', background: '#0a0f1c' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px, 0.6vw, 12px)', padding: '0 clamp(10px, 1.2vw, 24px)', marginBottom: 'clamp(16px, 2vw, 40px)' }}>
          <div style={{ width: 'clamp(14px, 1.8vw, 36px)', height: 'clamp(14px, 1.8vw, 36px)', borderRadius: 'clamp(4px, 0.5vw, 10px)', background: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(217,70,239,0.3)' }}>
            <Sparkles style={{ width: '50%', height: '50%' }} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(6px, 0.7vw, 16px)', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>NEXUS // SYS_OP</div>
            <div style={{ fontSize: 'clamp(4px, 0.5vw, 11px)', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Dashboard</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 clamp(6px, 0.8vw, 16px)' }}>
          {navTabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 0.7vw, 14px)', borderRadius: 'clamp(5px, 0.6vw, 11px)',
                  padding: 'clamp(6px, 0.7vw, 14px) clamp(6px, 0.8vw, 16px)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: active ? 'rgba(139,92,246,0.1)' : 'transparent',
                  color: active ? '#c084fc' : 'rgba(148,163,184,0.7)', fontSize: 'clamp(6px, 0.6vw, 14px)', fontWeight: active ? 700 : 500,
                  transition: 'all 0.2s', marginBottom: 'clamp(2px, 0.3vw, 6px)' }}>
                <Icon style={{ width: 'clamp(6px, 0.8vw, 16px)', height: 'clamp(6px, 0.8vw, 16px)' }} strokeWidth={active ? 2.5 : 2} />
                {t.label}
              </button>
            );
          })}
          
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: 'clamp(10px, 1.2vw, 24px) 0' }} />
          
          {/* Link to Operational Control */}
          <button 
            onClick={() => navigate('/admin/panel/home')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 0.7vw, 14px)', borderRadius: 'clamp(5px, 0.6vw, 11px)',
              padding: 'clamp(6px, 0.7vw, 14px) clamp(6px, 0.8vw, 16px)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'left',
              background: 'rgba(255,255,255,0.02)', color: '#e2e8f0', fontSize: 'clamp(6px, 0.6vw, 14px)', fontWeight: 600,
              transition: 'all 0.2s' }}>
            <Users style={{ width: 'clamp(6px, 0.8vw, 16px)', height: 'clamp(6px, 0.8vw, 16px)' }} color="#4ade80" />
            Admin Control Panel
          </button>
        </nav>

        <div style={{ padding: 'clamp(8px, 1vw, 24px) clamp(10px, 1.2vw, 24px)', paddingTop: 0 }}>
          <div style={{ fontSize: 'clamp(4px, 0.5vw, 11px)', color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', marginBottom: 'clamp(2px, 0.3vw, 6px)' }}>Active Session</div>
          <div style={{ fontSize: 'clamp(5px, 0.6vw, 13px)', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <div style={{ fontSize: 'clamp(5px, 0.6vw, 12px)', color: '#8b5cf6', fontWeight: 700, marginTop: 'clamp(2px, 0.3vw, 6px)' }}>[ {user?.role} ]</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(18px, 1.8vw, 40px) clamp(20px, 2vw, 44px)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            {TABS[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
