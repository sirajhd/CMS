import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

/**
 * Standard Empty State Placeholder
 */
export function EmptyState({ 
  icon: Icon = FolderOpen, 
  title = 'No items found', 
  description = 'There are currently no records matching this criteria.', 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="p-10 text-center flex flex-col items-center justify-center bg-[#161b22] rounded-2xl border border-dashed border-[#30363d]">
      <div className="p-3.5 bg-[#0d1117] text-slate-400 rounded-2xl mb-3 border border-[#30363d]">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;