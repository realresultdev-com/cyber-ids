import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Radio,
  FileCode,
  LineChart,
  Search,
  AlertTriangle,
  Database,
  Sliders,
  Scale,
  Cpu,
  BarChart3,
  Network,
  Crosshair,
  FileText,
  Settings,
  LogOut,
  Terminal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { path: '/', label: 'Security Overview', icon: LayoutDashboard },
        { path: '/monitoring', label: 'Live Network Monitor', icon: Radio },
        { path: '/inspector', label: 'Packet Inspector', icon: FileCode },
        { path: '/traffic-analysis', label: 'Traffic Analysis', icon: LineChart },
        { path: '/detection', label: 'Intrusion Detection', icon: Search },
        { path: '/alerts', label: 'Security Incidents', icon: AlertTriangle },
      ],
    },
    {
      title: 'THREAT RESEARCH',
      items: [
        { path: '/datasets', label: 'Dataset Laboratory', icon: Database },
        { path: '/preprocessing', label: 'Traffic Preprocessing', icon: Sliders },
        { path: '/imbalance-analysis', label: 'Class Imbalance Analysis', icon: Scale },
        { path: '/training', label: 'ML Model Laboratory', icon: Cpu },
        { path: '/comparison', label: 'Model Comparison', icon: BarChart3 },
        { path: '/deep-learning', label: 'Deep Learning Analysis', icon: Network },
      ],
    },
    {
      title: 'SECURITY INTELLIGENCE',
      items: [
        { path: '/attack-classification', label: 'Attack Classification', icon: Crosshair },
        { path: '/threat-intel', label: 'Threat Intelligence', icon: Terminal },
        { path: '/reports', label: 'Security Reports', icon: FileText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/settings', label: 'System Configuration', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-[#24324D] flex flex-col h-screen fixed left-0 top-0 select-none z-20">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-[#24324D] flex items-center justify-between bg-[#0B0F19]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-slate-100 flex items-center gap-1.5 font-mono">
              <span>NETGUARD</span>
              <span className="text-[10px] text-blue-400 font-mono px-1.5 py-0.2 bg-blue-950/60 rounded border border-blue-800/60">SOC</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">IDS // ML RESEARCH</div>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-400 border border-[#24324D] px-1.5 py-0.5 rounded bg-[#131D31]">
          v2.4
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 mb-1 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-1.5 rounded text-xs transition-colors ${
                        isActive
                          ? 'bg-[#1E293B] text-blue-400 border-l-2 border-blue-500 font-medium'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-[#131D31]'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Operator Session Footer */}
      <div className="p-2.5 border-t border-[#24324D] bg-[#0B0F19]">
        <div className="flex items-center justify-between p-2 rounded bg-[#131D31] border border-[#24324D]">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-semibold text-[10px] text-slate-200">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-mono font-medium text-slate-200 truncate">
                {user?.username || 'admin'}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase">
                {user?.role || 'SOC_ANALYST'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Terminate Session"
            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
