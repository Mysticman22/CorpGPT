import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Briefcase, Phone, Lock, Eye, EyeOff, 
  ChevronDown, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { authService } from '../api/authService';
import { useToast } from '../components/ui/Toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    department: '', 
    position: '', 
    contact: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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
        
        // No default values - let user select
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.register(
        formData.email, 
        formData.password, 
        formData.fullName, 
        formData.contact, 
        formData.department, 
        formData.position
      );
      toast.success('Account provisioned successfully.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Cannot reach the server. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm font-medium opacity-80">
            Join NEXUS — your AI-powered workplace
          </p>
        </div>

        {/* Error Alert (Specific Red/Dark Theme) */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 bg-red-950/20 border-2 border-red-900/30 rounded-xl p-5 flex items-center gap-4 overflow-hidden"
            >
              <div className="p-2 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle size={20} className="text-red-500 shrink-0" />
              </div>
              <p className="text-red-400 text-sm font-bold tracking-tight uppercase leading-relaxed">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form 
          key="register"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          onSubmit={handleSubmit} 
          className="space-y-8 relative"
        >
          
          {/* Full Name */}
          <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
            <User size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
            <input 
              name="fullName" value={formData.fullName} onChange={handleChange} required
              className="bg-transparent border-none outline-none text-lg w-full text-white font-bold placeholder:text-transparent" 
              placeholder="Full Name"
            />
            <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Full Name *</span>
          </div>

          {/* Email */}
          <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
            <Mail size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
            <input 
              type="email" name="email" value={formData.email} onChange={handleChange} required
              className="bg-transparent border-none outline-none text-lg w-full text-white font-bold placeholder:text-transparent" 
              placeholder="Email Address"
            />
            <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Email *</span>
          </div>

          {/* Department & Position (Side by Side) */}
          <div className="grid grid-cols-2 gap-8 items-end">
            {/* Department */}
            <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
              <Briefcase size={18} className="text-slate-600 group-focus-within:text-white transition-colors shrink-0" />
              <div className="relative flex-1 flex items-center">
                <select 
                  name="department" value={formData.department} onChange={handleChange} required
                  className="bg-transparent border-none outline-none text-white text-base w-full font-bold appearance-none cursor-pointer pr-4"
                >
                  <option value="" disabled className="bg-[#0b0e14]">Select Department</option>
                  {availableDepartments.map(d => <option key={d} value={d} className="bg-[#0b0e14]">{d}</option>)}
                </select>
                <ChevronDown size={16} className="text-white/30 absolute right-0 pointer-events-none" />
              </div>
              <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Dept *</span>
            </div>

            {/* Position */}
            <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
              <ShieldCheck size={18} className="text-slate-600 group-focus-within:text-white transition-colors shrink-0" />
              <div className="relative flex-1 flex items-center">
                <select 
                  name="position" value={formData.position} onChange={handleChange} required
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

          {/* Contact */}
          <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
            <Phone size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
            <input 
              name="contact" value={formData.contact} onChange={handleChange} required
              className="bg-transparent border-none outline-none text-lg w-full text-white font-bold placeholder:text-transparent" 
              placeholder="Contact Number"
            />
            <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Contact *</span>
          </div>

          {/* Password */}
          <div className="group relative border-b border-white/10 focus-within:border-white/30 transition-all py-2 flex items-center gap-4">
            <Lock size={18} className="text-slate-600 group-focus-within:text-white transition-colors" />
            <input 
              type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
              className="bg-transparent border-none outline-none text-lg w-full text-white font-bold placeholder:text-transparent" 
              placeholder="Master Pass"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-600 hover:text-white transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <span className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Password *</span>
          </div>

          <div className="pt-6 flex flex-col items-center gap-8">
            <button 
              type="submit" disabled={loading}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#d63384] to-[#6f42c1] text-white font-black text-lg shadow-[0_12px_24px_-5px_rgba(214,51,132,0.4)] hover:shadow-[0_16px_32px_-5px_rgba(214,51,132,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center relative group/btn overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[20deg]" />
              {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Account"}
            </button>

            <Link to="/login" className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
              Already have an account? <span className="text-[#6f42c1] hover:underline underline-offset-8">Sign In</span>
            </Link>
          </div>
        </motion.form>
      </motion.div>

      <style>{`
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
