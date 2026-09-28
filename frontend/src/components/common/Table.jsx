import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Responsive Table Wrapper with clickable row support
 */
export function Table({ 
  columns = [], 
  data = [], 
  renderRow, 
  keyExtractor, 
  onRowClick,
  className = '' 
}) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-2xl border border-[#30363d] bg-[#161b22] shadow-md', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#30363d] bg-[#0d1117] text-[11px] font-black uppercase tracking-wider text-slate-400">
            {columns.map((col, idx) => (
              <th key={idx} className={cn('py-3.5 px-4', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30363d]/60 text-xs text-slate-300">
          {data.map((item, idx) => {
            const key = keyExtractor ? keyExtractor(item) : idx;
            return (
              <tr 
                key={key} 
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  'transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-[#21262d]' : 'hover:bg-[#1c2128]'
                )}
              >
                {renderRow(item, idx)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;