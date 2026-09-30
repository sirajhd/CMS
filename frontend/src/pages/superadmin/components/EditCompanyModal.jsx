import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle, Save, ShieldAlert } from 'lucide-react';
import { superAdminService } from '../../../services/superAdminService';

export function EditCompanyModal({ isOpen, onClose, company, onCompanyUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    plan: 'PRO',
    status: 'ACTIVE',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        code: company.code || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        plan: company.plan || 'PRO',
        status: company.status || 'ACTIVE',
      });
      setError('');
    }
  }, [company]);

  if (!isOpen || !company) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company name is required.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await superAdminService.updateCompany(company.id, formData);
      if (onCompanyUpdated) {
        onCompanyUpdated(response.company || response);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update company information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#b4e600] text-black rounded-xl shadow-md">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Edit Tenant Workspace
              </h2>
              <p className="text-xs text-slate-400">
                Update details for {company.name}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Tenant Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Account Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
              >
                <option value="ACTIVE">ACTIVE (Operational)</option>
                <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
                <option value="DEACTIVATED">DEACTIVATED (Terminated)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Headquarters Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Subscription Tier
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
              >
                <option value="STARTER">Starter Tier</option>
                <option value="PRO">Pro Tier</option>
                <option value="ENTERPRISE">Enterprise Tier</option>
              </select>
            </div>
          </div>

          {formData.status === 'SUSPENDED' && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2 text-xs text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>Warning: Suspending this company will immediately prevent all its users from logging in or making API requests.</span>
            </div>
          )}

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
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCompanyModal;
