import React, { useState, useEffect } from 'react';
import { materialService } from '../../services/materialService';
import { Boxes, Truck, CheckCircle2, Clock } from 'lucide-react';

export function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await materialService.getAllMaterials();
        setMaterials(data || []);
      } catch (err) {
        console.error('Failed to load materials:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight uppercase">Materials Logistics & Site Consignments</h1>
        <p className="text-xs text-slate-400">Rebar, cement, aggregates, and site delivery verifications.</p>
      </div>

      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0d1117] border-b border-[#30363d] text-slate-400 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Material Spec</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Est. Cost</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-xs">
                    Loading material consignments from PostgreSQL...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-xs">
                    No material consignments logged.
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-[#21262d]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{m.materialName}</div>
                      <div className="text-[10px] text-slate-400">{m.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{m.projectName}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{m.quantity} {m.unit}</td>
                    <td className="py-3.5 px-4 font-black text-[#b4e600]">{m.estimatedCost?.toLocaleString()} ETB</td>
                    <td className="py-3.5 px-4 text-slate-300">{m.requestedBy}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        m.deliveryStatus === 'Delivered'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}>
                        {m.deliveryStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MaterialsPage;
