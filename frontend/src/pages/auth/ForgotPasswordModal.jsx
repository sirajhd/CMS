import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2, X, ExternalLink, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';

export function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', onOpenResetWithToken }) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-[#f0f6fc] space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#21262d] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#b4e600]/10 border border-[#b4e600]/30 text-[#b4e600] text-[11px] font-bold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" />
            <span>Account Recovery</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white uppercase">
            Forgot Password?
          </h2>
          <p className="text-xs text-slate-400">
            {successInfo
              ? 'Check your inbox for password reset instructions.'
              : 'Enter your email address and we will send you a secure link to reset your password.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successInfo ? (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-300">Email Dispatched!</p>
                <p className="text-slate-300">
                  We have sent reset instructions to <span className="font-semibold text-white">{email}</span>.
                </p>
                <p className="text-slate-400 text-[11px]">
                  The reset link is active for 60 minutes. Please check your inbox and spam folder.
                </p>
              </div>
            </div>

            {/* Development Quick-Access Link */}
            {successInfo.devResetUrl && (
              <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#b4e600] font-semibold">
                  <span>⚡ Development Quick-Link:</span>
                  <span className="text-slate-500 font-normal">Active Token</span>
                </div>
                <a
                  href={successInfo.devResetUrl}
                  onClick={(e) => {
                    if (onOpenResetWithToken && successInfo.devToken) {
                      e.preventDefault();
                      onOpenResetWithToken(successInfo.devToken);
                    }
                  }}
                  className="w-full py-2 px-3 bg-[#21262d] hover:bg-[#30363d] text-blue-400 hover:text-blue-300 text-xs font-mono rounded-lg transition-colors flex items-center justify-between gap-2 break-all text-left"
                >
                  <span className="truncate">Open Reset Password Form</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Back to Sign In
              </button>
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
                htmlFor="forgot-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
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

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Remember your password? <span className="text-[#b4e600] hover:underline font-semibold">Log In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
