import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, variant = 'default' }) => {
  const valueColor = {
    default: 'text-slate-100',
    critical: 'text-rose-400',
    threat: 'text-rose-400',
    warning: 'text-amber-400',
    success: 'text-slate-100',
    normal: 'text-slate-100',
    info: 'text-blue-400',
    cyan: 'text-blue-400',
  };

  const chosenColor = valueColor[variant] || valueColor.default;

  return (
    <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-medium">
          {title}
        </span>
        {Icon && (
          <div className="p-1 rounded bg-[#1E293B] text-slate-400 border border-[#24324D]">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className={`text-xl font-mono font-bold tracking-tight ${chosenColor}`}>
          {value !== undefined && value !== null ? value : '--'}
        </div>
        {trend && (
          <span
            className={`text-[10px] font-mono font-medium ${
              trend > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="mt-1 text-[11px] font-mono text-slate-400 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};
