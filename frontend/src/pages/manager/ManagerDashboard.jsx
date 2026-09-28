import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { paymentService } from '../../services/paymentService';
import { materialService } from '../../services/materialService';
import { ShieldAlert, Truck, DollarSign, Boxes } from 'lucide-react';

export function ManagerDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [projData, payData, matData] = await Promise.all([
          projectService.getAllProjects(),
          paymentService.getAllPayments(),
          materialService.getAllMaterials(),
        ]);
        setProjects(projData || []);
        setPayments(payData || []);
        setMaterials(matData || []);
      } catch (err) {
        console.error('Failed to load manager dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const pendingPayments = payments.filter((p) => p.status === 'Approved');
  const pendingDeliveries = materials.filter((m) => m.deliveryStatus === 'Pending');

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight uppercase">Operations Management Dashboard</h1>
        <p className="text-xs text-slate-400">Logistics dispatch, disbursement execution, and site material clearance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Sites</p>
            <p className="text-2xl font-black text-white mt-1">{projects.length}</p>
            <p className="text-xs text-[#b4e600] mt-1 font-semibold">Supervised Operations</p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
            <Boxes className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disbursements Ready</p>
            <p className="text-2xl font-black text-white mt-1">{pendingPayments.length}</p>
            <p className="text-xs text-emerald-400 mt-1 font-semibold">Approved for settlement</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Deliveries</p>
            <p className="text-2xl font-black text-white mt-1">{pendingDeliveries.length}</p>
            <p className="text-xs text-amber-400 mt-1 font-semibold">Awaiting waybill verification</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
            <Truck className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Operational Directives */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md p-5">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Operations Clearance Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fiscal Clearance</span>
            <p className="text-sm font-bold text-white mt-1">
              {pendingPayments.length > 0 ? `${pendingPayments.length} Payments Queued For Disbursement` : 'All Approved Vouchers Settled'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Manager sign-off enables bank transfer or cash distribution</p>
          </div>
          <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Material Logistics</span>
            <p className="text-sm font-bold text-white mt-1">
              {pendingDeliveries.length > 0 ? `${pendingDeliveries.length} Consignments In Transit` : 'All Supply Consignments Delivered'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Waybill inspection and store receipting operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
