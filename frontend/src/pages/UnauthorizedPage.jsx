import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const roleLabels = {
    SUPER_ADMIN: 'Super Admin',
    DEPARTMENT_ADMIN: 'Department Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  };

  const homeRoute = ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'].includes(user?.role) ? '/admin' : '/';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0e14] text-slate-200 font-sans relative overflow-hidden">
      
      {/* ── Background Elements ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] rounded-full bg-rose-900/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm glass-card p-10 rounded-[2.5rem] border border-rose-500/20 shadow-2xl relative z-10 mx-4 text-center"
      >
        <div className="size-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-700/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/10">
          <ShieldOff size={32} className="text-rose-500" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          403 — Protocol Violation
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">Access Denied</h1>
        <p className="text-xs text-slate-400 leading-relaxed font-medium mb-8">
          Your credentials do not hold the required clearance for this sector.
          {user?.role && (
            <div className="mt-3 flex flex-col items-center gap-1">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Current Designation</span>
              <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => navigate(homeRoute)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-98 transition-all"
          >
            <Home size={14} /> Control
          </button>
        </div>
      </motion.div>

      <style>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(24px);
        }
      `}</style>
    </div>
  );
}
