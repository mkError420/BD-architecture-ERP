import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  HardHat,
  TrendingUp,
  FileCheck2,
  Users2,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@construction.com');
  const [password, setPassword] = useState('password');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate('/');
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen w-full bg-[#080C14] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Grid Blueprint Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Centered Container */}
      <div className="w-full max-w-6xl mx-auto relative z-10 my-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: Brand Hero & Value Propositions */}
          <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-4 lg:pr-6">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-amber-500 p-0.5 shadow-xl shadow-blue-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white">
                  <Building2 size={28} className="text-blue-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-white">Buildium-solution</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    ERP v2.4
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold tracking-wide mt-0.5">
                  Bangladesh Construction Management Platform
                </p>
              </div>
            </div>

            {/* Industry Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold mb-5 w-fit shadow-xs">
              <span>Tailored for Bangladesh Construction & Real Estate</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.2] tracking-tight">
              Streamline Construction Projects from{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-400">
                Piling to Handover
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed max-w-xl">
              Track daily site attendance, material inventory, BDT budgeting, contractor work orders,
              RAJUK compliance vault, and automated client billing in one unified system.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3.5 mt-7 max-w-xl">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">Daily Site Labor</p>
                  <p className="text-[11px] text-slate-400 truncate">Muster roll & wages</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">BDT Budget & BOQ</p>
                  <p className="text-[11px] text-slate-400 truncate">Real-time cost tracking</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">RAJUK Compliance</p>
                  <p className="text-[11px] text-slate-400 truncate">Permits & approvals</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">Vendor Invoicing</p>
                  <p className="text-[11px] text-slate-400 truncate">VAT & NBR ready</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 pt-6 border-t border-slate-800/80 max-w-xl">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">৳85 Cr+</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Budget Managed</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">100%</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">VAT & NBR Ready</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-amber-400">150+</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Sites & Labor Teams</p>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">

              {/* Subtle top card glow line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

              {/* Form Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Sign In
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Access your enterprise construction management dashboard
                </p>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-0 bottom-0 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      placeholder="name@construction.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                      Forgot?
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-0 bottom-0 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-12 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-0 bottom-0 flex items-center text-slate-400 hover:text-slate-200 transition-colors px-1 cursor-pointer"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 font-medium">Keep me signed in</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 size={13} /> SSL Secured
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#D3C987] hover:bg-[#a0975a] text-black rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} /> Sign In to Dashboard <ArrowRight size={16} className="ml-0.5 opacity-80" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Account Quick Access Card */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    Default System Login:
                  </p>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin@construction.com', 'password')}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>

                <div
                  onClick={() => handleFillDemo('admin@construction.com', 'password')}
                  className="p-3.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/40 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300 group-hover:text-white">admin@construction.com</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Admin
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400 font-mono">
                    <span>Password: <strong className="text-slate-300">password</strong></span>
                    <span className="text-[10px] text-slate-500">Click to use</span>
                  </div>
                </div>
              </div>

              {/* System Footer Note */}
              <div className="mt-5 text-center">
                <p className="text-[11px] text-slate-500">
                  © {new Date().getFullYear()} Buildium-solution Ltd. • All Rights Reserved.
                  Developed by <a href="https://codexaa.xo.je" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer transition-colors">Codexxaa-Solutions</a>.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


