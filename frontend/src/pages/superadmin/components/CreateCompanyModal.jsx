import React, { useState } from 'react';
import { X, Building2, User, Mail, Lock, Phone, MapPin, Globe, Sparkles, AlertCircle } from 'lucide-react';
import { superAdminService } from '../../../services/superAdminService';

export function CreateCompanyModal({ isOpen, onClose, onCompanyCreated }) {
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
      setError('Please fill in all mandatory company and system admin details.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('System Admin password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await superAdminService.createCompany(formData);
      if (onCompanyCreated) {
        onCompanyCreated(response.company);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to provision new company tenant workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#b4e600] text-black rounded-xl shadow-md">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Provision New Construction Company
              </h2>
              <p className="text-xs text-slate-400">
                Create an isolated tenant workspace and initial System Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Company Profile */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#b4e600] flex items-center gap-2 mb-3 pb-1 border-b border-[#30363d]">
              <Building2 className="w-4 h-4" />
              1. Company / Tenant Workspace Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Builders Ltd"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Tenant Code (Identifier)
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. ACME"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Company Contact Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@acme.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Company Contact Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+251 91 123 4567"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Headquarters Location / Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Bole Sub-City, Addis Ababa"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Subscription Plan
                </label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                >
                  <option value="STARTER">Starter Tier (1-3 Sites)</option>
                  <option value="PRO">Pro Tier (Multi-Site)</option>
                  <option value="ENTERPRISE">Enterprise (Unlimited)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Initial System Admin */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#b4e600] flex items-center gap-2 mb-3 pb-1 border-b border-[#30363d]">
              <User className="w-4 h-4" />
              2. Initial Company System Admin Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Admin Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="adminName"
                  required
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Admin Job Title
                </label>
                <input
                  type="text"
                  name="adminTitle"
                  value={formData.adminTitle}
                  onChange={handleChange}
                  placeholder="e.g. Operations Director"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Admin Login Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  required
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="admin@acme.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Admin Initial Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  required
                  value={formData.adminPassword}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#30363d] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#b4e600]/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Provisioning...' : 'Provision Tenant Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCompanyModal;
