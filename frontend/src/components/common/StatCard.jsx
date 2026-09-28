import React from 'react';
import { cn } from '../../utils/cn';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'lime', className = '' }) {
  const colorStyles = {
    lime: 'bg-[#b4e600]/10 text-[#b4e600] border-[#b4e600]/30',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  return (
    <div className={cn('bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between', className)}>
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="text-2xl font-black text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-[#b4e600] mt-1 font-semibold">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={cn('p-3 rounded-xl border', colorStyles[color] || colorStyles.lime)}>
          <Icon className="w-6 h-6 stroke-[2.5]" />
        </div>
      )}
    </div>
  );
}

export default StatCard;
