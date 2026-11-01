import React from 'react';
import { Database } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Database,
  title = 'NO TELEMETRY RECORDS',
  description = 'No network traffic or threat records matched current query.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#24324D] rounded-md bg-[#0F172A]/50">
      <div className="p-3 bg-[#1E293B] rounded-md text-blue-400 mb-3 border border-[#24324D]">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">{title}</h4>
      <p className="text-xs font-mono text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
