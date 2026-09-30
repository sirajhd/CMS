import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight, HardHat, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeParams = useParams();

  // Support both /reset-password?token=XYZ and /reset-password/XYZ
  const token = searchParams.get('token') || routeParams.token || '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setTokenValid(false);
      setVerifyError('No password reset token was provided. Please request a new reset link.');
      return;
    }

    const verifyToken = async () => {
      setIsVerifying(true);
      try {
        const res = await authService.verifyResetToken(token);
        if (res.valid) {
          setTokenValid(true);
          setUserInfo(res);
        } else {
          setTokenValid(false);
          setVerifyError(res.message || 'Reset token is invalid or expired.');
        }
      } catch (err) {
        setTokenValid(false);
        setVerifyError(err.message || 'Failed to verify reset token. It may have expired.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setSubmitError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to reset password. The link might have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#f0f6fc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#b4e600]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-[#b4e600] text-black rounded-2xl shadow-xl mb-4 ring-4 ring-[#b4e600]/20">
          <HardHat className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          HDtech-CMS
        </h1>
        <p className="mt-1.5 text-xs text-slate-400">
          Secure Password Recovery Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#161b22] py-8 px-6 shadow-2xl rounded-2xl border border-[#30363d] sm:px-10 space-y-6">
          {/* State 1: Verifying Token */}
          {isVerifying && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#b4e600] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Verifying your reset security link...
              </p>
              <p className="text-xs text-slate-500">Checking authorization token with server</p>
            </div>
          )}

          {/* State 2: Invalid / Expired Token */}
          {!isVerifying && !tokenValid && (
            <div className="space-y-6">
              <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-red-200">Link Invalid or Expired</p>
                  <p className="text-red-300 leading-relaxed">
                    {verifyError || 'This password reset link is invalid or has already expired for security.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Request New Reset Link</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </Link>
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 text-center text-xs text-slate-400 hover:text-white transition-colors block"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* State 3: Password Successfully Reset */}
          {!isVerifying && tokenValid && isSuccess && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-300">Password Reset Complete!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Your password has been successfully updated. You can now access your account with your new credentials.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#b4e600]/20"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

          {/* State 4: Valid Token - New Password Form */}
          {!isVerifying && tokenValid && !isSuccess && (
            <>
              <div className="border-b border-[#30363d] pb-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#b4e600]/10 border border-[#b4e600]/30 text-[#b4e600] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Set New Password
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Resetting credentials for <strong className="text-white">{userInfo?.email || 'your account'}</strong>
                </p>
              </div>

              {submitError && (
                <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="new-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
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

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1">
                        <div className={`flex-1 rounded-full ${strengthScore >= 1 ? 'bg-red-500' : 'bg-slate-700'}`} />
                        <div className={`flex-1 rounded-full ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                        <div className={`flex-1 rounded-full ${strengthScore >= 3 ? 'bg-yellow-400' : 'bg-slate-700'}`} />
                        <div className={`flex-1 rounded-full ${strengthScore >= 4 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-right">
                        {strengthScore <= 1 && 'Weak password'}
                        {strengthScore === 2 && 'Fair password'}
                        {strengthScore === 3 && 'Good password'}
                        {strengthScore >= 4 && 'Strong password'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label 
                    htmlFor="confirm-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your new password"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#b4e600]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Password & Sign In</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel and Return to <span className="text-[#b4e600] hover:underline">Log In</span>
                </Link>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#30363d]/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#b4e600]" />
            <span>Encrypted with SHA-256 Tokens & Bcrypt Hashing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
