import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Standard Dropdown Select Component
 */
export function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  helperText,
  placeholder = 'Select an option',
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

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full rounded-xl border bg-[#0d1117] px-3.5 py-2 text-xs text-white transition-all',
          'focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]',
          'disabled:bg-[#161b22] disabled:text-slate-500 disabled:cursor-not-allowed',
          error ? 'border-rose-500/80 focus:ring-rose-400' : 'border-[#30363d]',
          className
        )}
        {...props}
      >
        <option value="" disabled className="bg-[#161b22] text-slate-500">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value !== undefined ? opt.value : opt} className="bg-[#161b22] text-white">
            {opt.label !== undefined ? opt.label : opt}
          </option>
        ))}
      </select>

      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Select;