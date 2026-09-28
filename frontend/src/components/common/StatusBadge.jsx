import React from 'react';
import { getStatusStyle } from '../../utils/formatters';
import { cn } from '../../utils/cn';

/**
 * Visual Status Pill Badge
 * Displays consistent color schemes and supports click interactions
 */
export function StatusBadge({ status, onClick, className = '' }) {
  const style = getStatusStyle(status);
  const isClickable = Boolean(onClick);

  return (
    <span
      onClick={(e) => {
        if (isClickable) {
          e.stopPropagation(); // Avoid duplicate triggering if row is also clicked
          onClick(e);
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none transition-all',
        style.bg,
        style.text,
        style.border,
        isClickable && 'cursor-pointer hover:opacity-85 hover:shadow-xs active:scale-95',
        className
      )}
      title={isClickable ? `Click to inspect ${status} status` : undefined}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  );
}

export default StatusBadge;