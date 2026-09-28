import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2, HardHat, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      setSuccessInfo(response);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessInfo(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#f0f6fc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#b4e600]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-[#b4e600] text-black rounded-2xl shadow-xl mb-4 ring-4 ring-[#b4e600]/20">
          <HardHat className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          Construction Management System
        </h1>
        <p className="mt-1.5 text-xs text-slate-400">
          Account Security & Password Recovery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#161b22] py-8 px-6 shadow-2xl rounded-2xl border border-[#30363d] sm:px-10 space-y-6">
          <div className="border-b border-[#30363d] pb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#b4e600]/10 border border-[#b4e600]/30 text-[#b4e600] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Mail className="w-3.5 h-3.5" />
              <span>Password Recovery</span>
            </div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Forgot Your Password?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your registered email address and we'll send you a password reset link.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successInfo ? (
            <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-300">Reset Email Dispatched!</p>
                  <p className="text-slate-300">
                    We've sent password reset instructions to <strong className="text-white">{email}</strong>.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    The link will expire in 60 minutes. Please check your inbox and spam folder.
                  </p>
                </div>
              </div>

              {/* Dev Quick Link */}
              {successInfo.devResetUrl && (
                <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#b4e600] font-semibold">
                    <span>⚡ Development Quick-Link:</span>
                    <span className="text-slate-500 font-normal">Active Token</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${successInfo.devToken}`)}
                    className="w-full py-2 px-3 bg-[#21262d] hover:bg-[#30363d] text-blue-400 hover:text-blue-300 text-xs font-mono rounded-lg transition-colors flex items-center justify-between gap-2 text-left"
                  >
                    <span className="truncate">Open Reset Password Form</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all text-center shadow-md"
                >
                  Back to Sign In
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 px-4 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Send to another email</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="forgot-email-page"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="forgot-email-page"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#b4e600]/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Remember your password? <span className="text-[#b4e600] hover:underline font-semibold">Sign In</span>
                </Link>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-[#30363d]/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#b4e600]" />
            <span>Secure Password Recovery Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
