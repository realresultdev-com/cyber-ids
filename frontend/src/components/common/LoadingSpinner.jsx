import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'FETCHING TELEMETRY...', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-blue-500`} />
      {text && <span className="mt-3 text-xs font-mono tracking-wider text-slate-400 uppercase">{text}</span>}
    </div>
  );
};
