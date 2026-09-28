import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomeRouteForRole } from '../../routes/ProtectedRoute';
import { HardHat, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState(() => {
    return localStorage.getItem('cms_remembered_email') || '';
  });
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => {
    return Boolean(localStorage.getItem('cms_remembered_email'));
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const resetSuccessMsg = searchParams.get('resetSuccess');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (rememberEmail) {
        localStorage.setItem('cms_remembered_email', email.trim());
      } else {
        localStorage.removeItem('cms_remembered_email');
      }

      const loggedUser = await login(email.trim(), password);
      const targetRoute = getHomeRouteForRole(loggedUser.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your email and password.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenResetWithToken = (token) => {
    setIsForgotPasswordOpen(false);
    navigate(`/reset-password?token=${token}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#f0f6fc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#b4e600]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-[#b4e600] text-black rounded-2xl shadow-xl mb-4 ring-4 ring-[#b4e600]/20">
          <HardHat className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          Construction Management System
        </h1>
        <p className="mt-1.5 text-xs text-slate-400">
          Secure Portal Authentication & Stakeholder Workspace
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#161b22] py-8 px-6 shadow-2xl rounded-2xl border border-[#30363d] sm:px-10 space-y-6">
          
          {/* Card Title */}
          <div className="border-b border-[#30363d] pb-4 text-center">
            <h2 className="text-lg font-black text-white uppercase tracking-widest text-[#b4e600]">
              LOG IN
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access your project dashboard
            </p>
          </div>

          {/* Reset Success Message */}
          {resetSuccessMsg && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200 animate-in fade-in duration-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Your password has been successfully reset. Please sign in with your new password.</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label 
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="w-4 h-4 rounded-md bg-[#0d1117] border-[#30363d] text-[#b4e600] focus:ring-[#b4e600] accent-[#b4e600]"
                />
                <span>Remember my email</span>
              </label>
            </div>

            {/* Actions: Primary Login Button & Bottom Forgot Password Link */}
            <div className="space-y-3 pt-2">
              {/* Primary Action: Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#b4e600]/20 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                <span>{isLoading ? 'Authenticating...' : 'Login'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              {/* Centered Link: Forgot password? */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer hover:underline inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Forgot password?</span>
                </button>
              </div>
            </div>
          </form>

          <div className="pt-4 border-t border-[#30363d]/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#b4e600]" />
            <span>Protected by JWT Authentication & RBAC</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
        onOpenResetWithToken={handleOpenResetWithToken}
      />
    </div>
  );
}

export default Login;
