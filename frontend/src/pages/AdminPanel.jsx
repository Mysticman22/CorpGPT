import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Building2, Database,
  CheckCircle, XCircle, ShieldOff, ShieldCheck, UserCog, LogOut,
  Search, RefreshCw, ChevronLeft, ChevronRight, Upload, X, MessageSquare,
  Activity, Shield, Terminal
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import api from '../api/axios';
import SecurePDFViewer from '../components/SecurePDFViewer';

// ── Shared UI Components ───────────────────────────────────────────────────────

function Badge({ text, status }) {
  const themes = {
    ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    SUSPENDED: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
  };
  const theme = themes[status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
  
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest border ${theme.bg} ${theme.text} ${theme.border}`}>
      {text}
    </span>
  );
}

function ActionBtn({ icon: Icon, color, title, label, onClick, loading }) {
  return (
    <button 
      onClick={onClick} 
      title={title}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[10px] font-bold transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
      style={{ borderColor: `${color}30`, backgroundColor: `${color}10`, color: color }}
    >
      {loading ? <RefreshCw size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

function UsersTab() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.getAdminUsers({ page, page_size: 15, search });
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  
  const handleAction = async (userId, path, actionKey, data = {}) => {
    setActionLoading(userId + actionKey);
    try {
      await api.post(path, data);
      toast.success('Protocol executed successfully.');
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Identity Registry</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Personnel Oversight</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" />
            <input 
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder="Search..."
              className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500/50 w-64 transition-all" 
            />
          </div>
          <button onClick={load} className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass-panel-inner overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Identity</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Directives</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center text-xs text-slate-500 animate-pulse font-black uppercase tracking-[0.2em]">Synchronizing Registry...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-xs text-slate-600 font-bold uppercase tracking-widest">No matching identities.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{u.full_name}</p>
                  <p className="text-[10px] text-slate-500 font-medium font-mono">{u.email}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">{u.role}</p>
                  <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tighter opacity-60">{u.department?.name || 'GENERIC'}</p>
                </td>
                <td className="px-5 py-4"><Badge text={u.status} status={u.status} /></td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                     {u.status === 'PENDING' && (
                       <>
                         <ActionBtn icon={ShieldCheck} color="#10b981" label="Approve" onClick={() => handleAction(u.id, `/admin/users/${u.id}/approve`, 'approve')} loading={actionLoading === u.id + 'approve'} />
                         <ActionBtn icon={XCircle} color="#ef4444" label="Reject" onClick={() => handleAction(u.id, `/admin/users/${u.id}/reject`, 'reject', { reason: 'Admin Rejected' })} loading={actionLoading === u.id + 'reject'} />
                       </>
                     )}
                     {u.status === 'ACTIVE' && (
                       <ActionBtn icon={ShieldOff} color="#f59e0b" label="Suspend" onClick={() => handleAction(u.id, `/admin/users/${u.id}/suspend`, 'suspend')} loading={actionLoading === u.id + 'suspend'} />
                     )}
                     {u.status === 'SUSPENDED' && (
                       <ActionBtn icon={ShieldCheck} color="#10b981" label="Activate" onClick={() => handleAction(u.id, `/admin/users/${u.id}/activate`, 'activate')} loading={actionLoading === u.id + 'activate'} />
                     )}
                     <ActionBtn icon={LogOut} color="#94a3b8" label="Force Terminal Exit" onClick={() => handleAction(u.id, `/admin/users/${u.id}/force-logout`, 'logout')} loading={actionLoading === u.id + 'logout'} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepartmentsTab() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDept, setNewDept] = useState('');

  const load = () => {
    setLoading(true);
    authService.getDepartments().then(setDepartments).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if(!newDept) return;
    try {
      await api.post('/departments', { name: newDept });
      toast.success('Sector initialized successfully.');
      setNewDept(''); load();
    } catch(e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Organizational Sectors</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Logistics & Permissions</p>
        </div>
      </div>

      <div className="glass-panel-inner p-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Initialize New Sector</h3>
        <form onSubmit={create} className="flex gap-3">
          <input 
            value={newDept} onChange={e => setNewDept(e.target.value)} 
            placeholder="Marketing, Engineering, Security..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-bold" 
          />
          <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">Create</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-xs text-slate-500 font-bold animate-pulse uppercase tracking-widest">Scanning Grid...</p>
        ) : departments.map(d => (
          <div key={d.id} className="glass-panel-inner p-4 flex justify-between items-center group hover:bg-white/[0.04] transition-all">
            <div>
              <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{d.name}</div>
              <div className="text-[10px] text-slate-600 font-mono mt-0.5">HEX_{d.id.substring(0,8)}...</div>
            </div>
            <button 
              onClick={() => {
                api.delete(`/departments/${d.id}`).then(() => { toast.success("Sector Decommissioned"); load(); }).catch(e => toast.error(e.message));
              }} 
              className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsTab() {
  const toast = useToast();
  const token = useAuthStore(s => s.token);
  const userEmail = useAuthStore(s => s.user?.email);
  
  const [docs, setDocs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [deptId, setDeptId] = useState('');
  const [viewDocId, setViewDocId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/documents`).then(r => setDocs(r.data)).catch(e => toast.error(e.message)).finally(() => setLoading(false));
    authService.getDepartments().then(d => { setDepts(d); if(d.length > 0) setDeptId(d[0].id) }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if(!file || !title || !deptId) return toast.error("Please fill all mission parameters.");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("department_id", deptId);
      formData.append("access_type", 'DEPARTMENT');

      await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document securely vaulted and queued for RAG analysis.');
      setFile(null); setTitle(''); load();
    } catch(e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Intelligence Vault</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">RAG Knowledge Management</p>
        </div>
      </div>
      
      <div className="glass-panel-inner p-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Secure Ingestion (PDF Protocol)</h3>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
             <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Codename</label>
             <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div className="space-y-1.5">
             <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Target Sector</label>
             <select value={deptId} onChange={e => setDeptId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer">
               {depts.map(d => <option key={d.id} value={d.id} className="bg-[#0b0e14]">{d.name}</option>)}
             </select>
          </div>
          <div>
             <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required className="hidden" id="file-upload" />
             <label htmlFor="file-upload" className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-all font-bold text-xs truncate">
               <Upload size={14} className="shrink-0" /> {file ? file.name : 'Select Object'}
             </label>
          </div>
          <button type="submit" className="h-9 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-700 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-98 transition-all shadow-lg shadow-indigo-600/20">Inject & Vectorize</button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">Vault Inventory</h3>
        {loading ? (
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Scanning Bio-Vault...</p>
        ) : docs.length === 0 ? (
          <p className="text-xs text-slate-600 font-bold uppercase tracking-widest py-10 text-center glass-panel-inner">Bio-Vault empty. No intelligence found.</p>
        ) : docs.map(d => (
          <div key={d.id} className="glass-panel-inner p-4 flex justify-between items-center group hover:bg-white/[0.03] transition-all">
            <div className="flex items-center gap-4">
              <div className="size-8 rounded bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5">
                <Database size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">{d.title}</p>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sector Access: <span className="text-indigo-400">{depts.find(dp => dp.id === d.department_id)?.name || 'UNASSIGNED'}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge text={d.embedding_status} status={d.embedding_status === 'COMPLETED' ? 'ACTIVE' : (d.embedding_status === 'FAILED' ? 'SUSPENDED' : 'PENDING')} />
              <button 
                onClick={() => setViewDocId(d.id)} 
                className="px-4 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all font-mono"
              >
                Secure_View
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewDocId && (
        <SecurePDFViewer 
          fileUrl={{ url: `${API}/documents/${viewDocId}/stream`, httpHeaders: { Authorization: `Bearer ${token}` } }}
          userEmail={userEmail}
          onClose={() => setViewDocId(null)}
        />
      )}
    </div>
  );
}

function ChatLogsTab() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    authService.getDepartmentChatLogs().then(setLogs).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Signal Intercepts</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Compliance & AI Telemetry</p>
        </div>
        <button onClick={load} className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Decrypting Signal Stream...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-600 font-bold uppercase tracking-widest py-10 text-center glass-panel-inner">No signals detected in sector range.</p>
        ) : logs.map(l => (
          <div key={l.id} className="glass-panel-inner overflow-hidden">
            <div onClick={() => toggleExpand(l.id)} className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${expandedId === l.id ? 'bg-white/5' : 'hover:bg-white/[0.03]'}`}>
              <div className="flex gap-4 items-center">
                <div className="size-10 rounded-lg bg-white/5 flex flex-col items-center justify-center border border-white/5 shrink-0">
                  <MessageSquare size={16} className="text-indigo-400" />
                  <span className="text-[8px] font-black text-slate-500 uppercase mt-0.5">{l.messages.length}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{l.title || 'Untitled Session'}</div>
                  <div className="flex gap-3 text-[10px] font-medium text-slate-500 mt-0.5">
                    <span className="font-bold text-indigo-400 uppercase tracking-widest">@{l.user_name}</span>
                    <span className="opacity-40 select-none">/</span>
                    <span className="font-mono text-[9px]">{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-indigo-500 opacity-60">
                {expandedId === l.id ? <ChevronLeft size={18} className="rotate-90" /> : <ChevronRight size={18} />}
              </div>
            </div>

            <AnimatePresence>
              {expandedId === l.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-black/20">
                  <div className="p-6 space-y-4">
                    {l.messages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 px-1">{msg.role}</span>
                        <div className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed font-medium ${msg.role === 'user' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100' : 'bg-white/5 border border-white/10 text-slate-300'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN AdminPanel ───────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const { user } = useAuthStore();

  const TABS = { users: <UsersTab />, departments: <DepartmentsTab />, documents: <DocumentsTab />, chat_logs: <ChatLogsTab /> };
  
  const navTabs = [
    { id: 'users', label: 'Identity Registry', icon: Users },
    { id: 'departments', label: 'Sector Control', icon: Building2 },
    { id: 'documents', label: 'Intel Vault', icon: Database },
    { id: 'chat_logs', label: 'Signal Logs', icon: MessageSquare }
  ];

  return (
    <div className="flex min-h-screen bg-[#050a14] text-slate-200 overflow-hidden font-sans">
      
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-900/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      {/* ── Visual Sidebar ── */}
      <div className="w-64 shrink-0 flex flex-col border-r border-white/5 bg-[#0a0f1c]/80 backdrop-blur-3xl z-10">
        
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <UserCog size={22} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-black text-white tracking-tighter leading-none">NEXUS</div>
            <div className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-1 opacity-80">SYS_OPS // PANEL</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-8">
          {navTabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  active 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/20">
           <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-white border border-white/10 uppercase">
                {user?.email?.[0]}
              </div>
              <div className="truncate">
                <p className="text-[10px] font-bold text-white truncate">{user?.email}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
              </div>
           </div>
        </div>
      </div>

      {/* ── Main Dashboard Content ── */}
      <div className="flex-1 overflow-y-auto relative z-10 px-12 py-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }} 
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            {TABS[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        .glass-panel-inner {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.25rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
