import React from 'react';

export const Card = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <div
      className={`bg-[#131D31] rounded-md border border-[#24324D] overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="px-4 py-2.5 border-b border-[#24324D] flex items-center justify-between bg-[#0F172A]/70">
          <div>
            {title && (
              <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-100 uppercase">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
