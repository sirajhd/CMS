import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Standard Text / Number / Email Input Field with label and error display
 */
export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  helperText,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={name} className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={cn(
            'w-full rounded-xl border bg-[#0d1117] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]',
            'disabled:bg-[#161b22] disabled:text-slate-500 disabled:cursor-not-allowed',
            Icon ? 'pl-9' : 'pl-3.5',
            error ? 'border-rose-500/80 focus:ring-rose-400 focus:border-rose-400' : 'border-[#30363d]',
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Input;