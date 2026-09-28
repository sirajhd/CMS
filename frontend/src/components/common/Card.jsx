import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Standard Card Container for content sections and dashboard modules
 */
export function Card({ children, className = '', title, subtitle, headerAction }) {
  return (
    <div className={cn('bg-[#161b22] border border-[#30363d] rounded-2xl shadow-md overflow-hidden text-[#f0f6fc]', className)}>
      {(title || headerAction) && (
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
          <div>
            {title && <h3 className="font-black text-white text-sm uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export default Card;