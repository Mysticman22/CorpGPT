import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, KeyRound, ArrowRight, ShieldCheck, 
  Terminal, AlertTriangle, Eye, EyeOff, MessagesSquare, Users, Shield,
  ChevronDown
} from 'lucide-react';
import { authService } from '../api/authService';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [otp, setOtp]               = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [department, setDepartment] = useState('');
  const [position, setPosition]     = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Metadata
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
        
        // No default values
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.login);
  const toast    = useToast();


  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login(email, password, department, position);
      if (res.otp_required) {
        setOtpSent(true);
        toast.success('OTP dispatched to secure terminal.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.verifyOTP(email, otp);
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      setAuth({ id: payload.sub, email: payload.email, role: payload.role }, data.access_token);
      toast.success('Identity verified. Accessing NEXUS.');
      
      if (['SUPER_ADMIN', 'DEPARTMENT_ADMIN'].includes(payload.role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Added resendOTP function
  const resendOTP = async () => {
    setResendLoading(true);
    try {
      await authService.resendOTP(email); // Assuming an authService.resendOTP method exists
      toast.success('New OTP dispatched.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0d1117] font-custom relative overflow-hidden">
      
      {/* ─── Minimalist Immersive Background ─── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-6 relative z-10 mx-6"
      >
        {/* Header Section */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Authorize Entry</h1>
          <p className="text-slate-400 text-sm font-medium opacity-80">
            Access the NEXUS security hub
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleStep1} 
              className="space-y-8 relative"
            >
              <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
                <Mail size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="bg-transparent border-none outline-none text-lg w-full text-white font-bold placeholder:text-transparent" 
                  placeholder="Email Address"
                />
                <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Email *</span>
              </div>

              {/* Password */}
              <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
                <Lock size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="bg-transparent border-none outline-none text-lg w-full text-white font-bold placeholder:text-transparent" 
                  placeholder="Master Pass"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-600 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Password *</span>
              </div>

              {/* Dept and Pos (Matching Register style) */}
              <div className="grid grid-cols-2 gap-8 items-end">
                <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
                  <Terminal size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
                  <div className="relative flex-1 flex items-center">
                    <select 
                      value={department} onChange={(e) => setDepartment(e.target.value)} required
                      className="bg-transparent border-none outline-none text-white text-base w-full font-bold appearance-none cursor-pointer pr-4"
                    >
                      <option value="" disabled className="bg-[#0b0e14]">Select Department</option>
                      {availableDepartments.map(d => <option key={d} value={d} className="bg-[#0b0e14]">{d}</option>)}
                    </select>
                    <ChevronDown size={16} className="text-white/30 absolute right-0 pointer-events-none" />
                  </div>
                  <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Sector *</span>
                </div>

                <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
                  <Shield size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
                  <div className="relative flex-1 flex items-center">
                    <select 
                      value={position} onChange={(e) => setPosition(e.target.value)} required
                      className="bg-transparent border-none outline-none text-white text-base w-full font-bold appearance-none cursor-pointer pr-4"
                    >
                      <option value="" disabled className="bg-[#0b0e14]">Select Position</option>
                      {availablePositions.map(p => <option key={p} value={p} className="bg-[#0b0e14]">{p}</option>)}
                    </select>
                    <ChevronDown size={16} className="text-white/30 absolute right-0 pointer-events-none" />
                  </div>
                  <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Position *</span>
                </div>
              </div>

              <div className="pt-8 flex flex-col items-center gap-10">
                <button 
                  type="submit" disabled={loading}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#d63384] to-[#6f42c1] text-white font-black text-lg shadow-[0_12px_24px_-5px_rgba(214,51,132,0.4)] hover:shadow-[0_16px_32px_-5px_rgba(214,51,132,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center relative group/btn overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[20deg]" />
                  {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : "Authorize Entry"}
                </button>

                <Link to="/register" className="text-sm font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                  Don't have access? <span className="text-[#6f42c1] hover:underline underline-offset-8">Request Provisioning</span>
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleOTPVerify}
              className="space-y-10"
            >
              <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-3 flex items-center gap-4">
                <KeyRound size={20} className="text-slate-600 group-focus-within:text-white transition-colors" />
                <input 
                  type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required
                  className="bg-transparent border-none outline-none text-xl w-full text-white font-black tracking-[1em] text-center placeholder:text-white/5" 
                  placeholder="000 000"
                />
                <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Auth Code *</span>
              </div>

              <div className="pt-8 space-y-6">
                <button 
                  type="submit" disabled={loading}
                  className="w-full h-20 rounded-[2rem] bg-gradient-to-r from-[#d63384] to-[#6f42c1] text-white font-black text-xl shadow-[0_15px_30px_-5px_rgba(214,51,132,0.4)] transition-all flex items-center justify-center"
                >
                  {loading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify Identity"}
                </button>
                <div className="text-center">
                  <button 
                    type="button" onClick={resendOTP} disabled={resendLoading}
                    className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    {resendLoading ? "Requesting..." : "Resend Security Code"}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center border-t border-white/5 pt-8">
          <Link to="/super-admin/login" className="text-[10px] text-white/10 hover:text-indigo-400/50 transition-all uppercase tracking-widest font-bold">
            Secure Admin Gateway
          </Link>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
          background-color: transparent !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          text-indent: 1px;
          text-overflow: '';
        }
      `}</style>
    </div>
  );
}
