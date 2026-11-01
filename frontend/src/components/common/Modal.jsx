import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidth} bg-[#131D31] border border-[#24324D] rounded-md shadow-2xl overflow-hidden z-10`}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#24324D] bg-[#0F172A]">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 text-slate-100">{children}</div>
        </div>
      </div>
    </div>
  );
};
