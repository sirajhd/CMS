import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Reusable Button Primitive
 * Supports variants: primary, secondary, danger, success, outline, ghost
 */
export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[#b4e600] hover:bg-[#cbf800] text-black font-black uppercase tracking-wider shadow-md focus:ring-[#b4e600] active:scale-[0.98]',
    secondary: 'bg-[#161b22] hover:bg-[#21262d] text-slate-200 border border-[#30363d] shadow-xs active:bg-[#0d1117]',
    danger: 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 focus:ring-rose-500 active:bg-rose-600/40',
    success: 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 focus:ring-emerald-500 active:bg-emerald-600/40',
    outline: 'border border-[#30363d] bg-transparent text-slate-300 hover:bg-[#161b22] hover:text-white focus:ring-slate-500',
    ghost: 'text-slate-400 hover:text-white hover:bg-[#161b22] focus:ring-slate-600',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export default Button;