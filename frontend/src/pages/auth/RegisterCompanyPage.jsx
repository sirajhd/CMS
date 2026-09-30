import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HardHat, 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { registerCompany } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    plan: 'PRO',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
    adminTitle: 'System Administrator',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !prev.code ? { code: value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.adminEmail.trim() || !formData.adminPassword) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await registerCompany(formData);
      // Redirect to the newly created company Admin Dashboard
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#f0f6fc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#b4e600]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center relative z-10 mb-6">
        <div className="inline-flex items-center justify-center p-3.5 bg-[#b4e600] text-black rounded-2xl shadow-xl mb-3 ring-4 ring-[#b4e600]/20">
          <HardHat className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          Register Construction Company Workspace
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          HDtech-CMS Multi-Tenant SaaS Platform • Create your isolated workspace in seconds
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-[#161b22] py-8 px-6 shadow-2xl rounded-2xl border border-[#30363d] sm:px-10 space-y-6">
          
          {/* Card Title */}
          <div className="border-b border-[#30363d] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider text-[#b4e600] flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company & Workspace Setup
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each company receives a completely isolated database and user directory
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#b4e600]/10 border border-[#b4e600]/30 text-[#b4e600] rounded-full text-[10px] font-mono font-bold uppercase">
              Free 30-Day Pro Trial
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Company Profile */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Construction Company Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Apex Construction PLC"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Workspace Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. APEX"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@apex.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251 91 234 5678"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Head Office Location / Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Bole Medhanialem, Addis Ababa"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>
            </div>

            {/* Step 2: System Admin Account */}
            <div className="space-y-4 pt-3 border-t border-[#30363d]">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#b4e600]" />
                <span>2. Company System Admin Account</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Admin Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    required
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="e.g. Dawit Bekele"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="adminTitle"
                    value={formData.adminTitle}
                    onChange={handleChange}
                    placeholder="e.g. Managing Director"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Admin Login Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    required
                    value={formData.adminEmail}
                    onChange={handleChange}
                    placeholder="dawit@apex.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Admin Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="adminPassword"
                      required
                      value={formData.adminPassword}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#b4e600]/20 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>{isLoading ? 'Creating Your Workspace...' : 'Create Company Workspace & Start'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="pt-4 border-t border-[#30363d]/80 flex items-center justify-between text-xs text-slate-400">
            <span>Already registered?</span>
            <Link
              to="/login"
              className="text-[#b4e600] hover:underline font-bold"
            >
              Sign In to Your Workspace →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterCompanyPage;
