import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, KeyRound, ArrowRight, ShieldCheck,
  Terminal, AlertTriangle, Cpu, Eye, EyeOff
} from 'lucide-react';
import { authService } from '../api/authService';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';

export default function SuperAdminLoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition]     = useState('');
  const [otp, setOtp]               = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);

  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.login);
  const toast    = useToast();

  const departments = [
    'Headquarters','Engineering','Marketing','Sales','Human Resources',
    'Finance','Operations','Information Technology','Legal','Customer Support'
  ];
  const positions = [
    'Employee','Senior Employee','Team Lead','Manager',
    'Senior Manager','Director','Vice President','C-Level Executive'
  ];

  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availablePositions, setAvailablePositions] = useState([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [depts, pos] = await Promise.all([
          authService.getDepartments(),
          authService.getPositions()
        ]);
        setAvailableDepartments(depts.map(d => d.name));
        setAvailablePositions(pos);
        // No defaults
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!email || !password || !department || !position) { toast.error('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await authService.login(email, password, department, position);
      if (res.otp_required) { setOtpSent(true); toast.success('OTP dispatched — check your email or backend terminal.'); }
    } catch (err) { toast.error(err.response?.data?.detail || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  // ── Step 2: OTP → JWT → role check ───────────────────────────────────────
  const handleOTPVerify = async (e) => {
    e.preventDefault();
    if (!otp) { toast.error('Enter the OTP.'); return; }
    setLoading(true);
    try {
      const data = await authService.verifyOTP(email, otp);
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      if (payload.role !== 'SUPER_ADMIN') {
        toast.error('Access denied — this portal is for Super Admins only.');
        setLoading(false);
        return;
      }
      setAuth({ id: payload.sub, email: payload.email, role: payload.role }, data.access_token);
      toast.success('Super Admin access granted. Welcome.');
      navigate('/super-admin');
    } catch (err) { toast.error(err.response?.data?.detail || 'Invalid OTP.'); }
    finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setResendLoading(true);
    try { await authService.requestOTP(email); setOtp(''); toast.success('New OTP sent.'); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed to resend OTP.'); }
    finally { setResendLoading(false); }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#060a0f] font-custom relative overflow-hidden">

      {/* ─── Background ─── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(220,38,38,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md glass p-10 rounded-[2.5rem] border-red-500/20 shadow-2xl relative overflow-hidden group z-10 mx-4"
        style={{ background: 'rgba(10, 10, 15, 0.7)' }}
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500" />

        {/* Logo */}
        <div className="flex flex-col items-center mb-10 relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 scale-animation">
            <ShieldCheck size={32} color="white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">NEXUS</h2>
          <p className="text-indigo-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-black opacity-80">Restricted Systems Gateway</p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-8 flex items-start gap-4 relative z-10">
          <AlertTriangle size={18} className="text-indigo-400 shrink-0" />
          <p className="text-[9px] text-indigo-300 leading-relaxed font-bold uppercase tracking-widest">
            Handshake Restricted. Every directive is logged. Authority verification required.
          </p>
        </div>

        {/* ── Step 1 ── */}
        {!otpSent && (
          <form onSubmit={handleStep1} className="flex flex-col space-y-4 relative z-10">
            <div className="group relative border-b border-white/10 hover:border-red-500/50 transition-colors">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-400 group-focus-within:text-red-500">
                <Mail size={18} />
              </div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} 
                placeholder="super.admin@company.com" required 
                className="w-full h-12 bg-transparent pl-12 pr-4 text-white outline-none text-sm placeholder:text-white/20" />
            </div>

            <div className="grid grid-cols-2 gap-0 border-b border-white/10">
              <div className="group relative border-r border-white/10">
                <select value={department} onChange={e => setDepartment(e.target.value)} required
                  className="w-full h-12 bg-transparent pl-4 pr-4 text-white outline-none text-xs appearance-none cursor-pointer">
                  <option value="" disabled className="bg-[#0f172a]">Select Department</option>
                  {availableDepartments.map(d => <option key={d} value={d} className="bg-[#0f172a]">{d}</option>)}
                </select>
              </div>
              <div className="group relative">
                <select value={position} onChange={e => setPosition(e.target.value)} required
                  className="w-full h-12 bg-transparent pl-4 pr-4 text-white outline-none text-xs appearance-none cursor-pointer">
                  <option value="" disabled className="bg-[#0f172a]">Select Position</option>
                  {availablePositions.map(p => <option key={p} value={p} className="bg-[#0f172a]">{p}</option>)}
                </select>
              </div>
            </div>

            <div className="group relative border-b border-white/10 hover:border-red-500/50 transition-colors">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-400 group-focus-within:text-red-500">
                <Lock size={18} />
              </div>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" required 
                className="w-full h-12 bg-transparent pl-12 pr-12 text-white outline-none text-sm placeholder:text-white/20" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-red-400 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-800 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 mt-4 flex items-center justify-center gap-3">
              {loading ? <Spin /> : <>Initiate Protocol <ArrowRight size={14} /></>}
            </button>
          </form>
        )}

        {/* ── Step 2 ── */}
        {otpSent && (
          <form onSubmit={handleOTPVerify} className="flex flex-col space-y-6 relative z-10">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest text-center">
              ✓ Credentials verified — Waiting for OTP
            </div>

            <div className="group relative border-b border-white/10 hover:border-red-500/50 transition-colors">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-400">
                <KeyRound size={20} />
              </div>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} 
                placeholder="6-digit OTP" maxLength={6} autoFocus required
                className="w-full h-14 bg-transparent pl-14 pr-4 text-white outline-none text-2xl font-black tracking-[0.5em] placeholder:text-white/10" />
            </div>

            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] text-white/30 uppercase tracking-tighter">Secure Communication Active</span>
              <button type="button" onClick={resendOTP} disabled={resendLoading} 
                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest disabled:opacity-50">
                {resendLoading ? 'Sending…' : 'Resend Code'}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-sm shadow-xl shadow-red-600/20 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 flex items-center justify-center gap-3">
              {loading ? <Spin /> : <><ShieldCheck size={16} /> Authenticate & Access</>}
            </button>

            <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setPassword(''); }}
              className="w-full text-center text-[10px] text-white/30 hover:text-white transition-colors font-bold uppercase tracking-widest">
              ← Back to Access
            </button>
          </form>
        )}

        <div className="mt-8 text-center relative z-10 border-t border-white/5 pt-6">
          <a href="/login" className="text-[10px] text-white/20 hover:text-white transition-colors uppercase tracking-widest font-black no-underline">
            ← System Employee Login
          </a>
        </div>
      </motion.div>

      <style>{`
        input, select { font-family: inherit; }
        input:focus, select:focus { outline: none; }
        select option { background: #0f172a; color: #e2e8f0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .scale-animation { animation: pulseBg 4s ease-in-out infinite; }
        @keyframes pulseBg {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function Spin() {
  return <div style={{ width: 'clamp(6px, 0.6vw, 11px)', height: 'clamp(6px, 0.6vw, 11px)', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />;
}
