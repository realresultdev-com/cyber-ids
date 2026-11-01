import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const variantStyles = {
    critical: 'bg-rose-950/50 text-rose-300 border-rose-800/60',
    malicious: 'bg-rose-950/50 text-rose-300 border-rose-800/60',
    threat: 'bg-rose-950/50 text-rose-300 border-rose-800/60',
    high: 'bg-rose-950/35 text-rose-300 border-rose-800/40',
    medium: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
    warning: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
    suspicious: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
    low: 'bg-blue-950/40 text-blue-300 border-blue-800/50',
    safe: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
    benign: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
    normal: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
    cyan: 'bg-blue-950/40 text-blue-300 border-blue-800/50',
    info: 'bg-blue-950/40 text-blue-300 border-blue-800/50',
    default: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.2 text-[9px]',
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const chosenVariant = variantStyles[variant?.toLowerCase?.()] || variantStyles.default;
  const chosenSize = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border ${chosenVariant} ${chosenSize} tracking-wider uppercase`}
    >
      {children}
    </span>
  );
};
