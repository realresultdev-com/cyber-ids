import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Activity, Clock, ShieldAlert, Cpu, Wifi } from 'lucide-react';
import { monitoringAPI, modelsAPI, alertsAPI } from '../../services/api';

export const Header = () => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState('');
  const [monitorStatus, setMonitorStatus] = useState({ isRunning: false, interface: 'demo' });
  const [activeModel, setActiveModel] = useState('Random Forest (SMOTE)');
  const [unreadAlerts, setUnreadAlerts] = useState(3);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll engine status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [liveRes, modelsRes, alertsRes] = await Promise.all([
          monitoringAPI.getLive().catch(() => ({ data: { is_running: false } })),
          modelsAPI.list().catch(() => ({ data: [] })),
          alertsAPI.list({ limit: 10 }).catch(() => ({ data: [] }))
        ]);
        if (liveRes.data) {
          setMonitorStatus({
            isRunning: liveRes.data.is_running || false,
            interface: liveRes.data.interface_name || 'Wi-Fi / eth0'
          });
        }
        if (modelsRes.data && modelsRes.data.length > 0) {
          setActiveModel(modelsRes.data[0].name);
        }
        if (alertsRes.data) {
          setUnreadAlerts(alertsRes.data.filter(a => a.status === 'NEW').length);
        }
      } catch (e) {
        // fail silently for header
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'SECURITY OPERATIONS OVERVIEW';
      case '/monitoring': return 'REAL-TIME NETWORK FLOW MONITOR';
      case '/inspector': return 'FORENSIC PACKET & FLOW INSPECTOR';
      case '/traffic-analysis': return 'STATISTICAL TRAFFIC ANALYSIS';
      case '/detection': return 'OFFLINE INTRUSION DETECTION';
      case '/alerts': return 'SECURITY INCIDENTS & ALERTS';
      case '/datasets': return 'DATASET RESEARCH LABORATORY';
      case '/preprocessing': return 'IMBALANCE PREPROCESSING & SMOTE';
      case '/imbalance-analysis': return 'CLASS IMBALANCE BENCHMARK';
      case '/training': return 'ML & DL MODEL LABORATORY';
      case '/comparison': return 'MODEL BENCHMARK COMPARISON';
      case '/deep-learning': return 'DEEP LEARNING NEURAL ANALYSIS';
      case '/attack-classification': return 'ATTACK TAXONOMY & CLASSIFICATION';
      case '/threat-intel': return 'THREAT INTELLIGENCE FEED';
      case '/reports': return 'SECURITY AUDIT REPORTS';
      case '/settings': return 'SYSTEM ENGINE CONFIGURATION';
      default:
        if (pathname.startsWith('/datasets/')) return 'DATASET SCHEMA INSPECTOR';
        if (pathname.includes('/evaluation')) return 'MODEL EVALUATION MATRIX';
        return 'NETWORK INTRUSION DETECTION PLATFORM';
    }
  };

  return (
    <header className="h-14 bg-[#0F172A] border-b border-[#24324D] flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Title without decorative colored bars/dots */}
      <div className="flex items-center space-x-2">
        <h1 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      {/* Security Telemetry Status Bar */}
      <div className="flex items-center space-x-2.5 text-[11px] font-mono">
        {/* Agent Status */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#131D31] border border-[#24324D]">
          <span className="text-slate-400">AGENT:</span>
          <span className="text-emerald-400 font-semibold">ONLINE</span>
        </div>

        {/* Capture Status */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#131D31] border border-[#24324D]">
          <span className="text-slate-400">CAPTURE:</span>
          <span className={`font-semibold ${monitorStatus.isRunning ? 'text-blue-400' : 'text-slate-400'}`}>
            {monitorStatus.isRunning ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>

        {/* Interface */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#131D31] border border-[#24324D]">
          <Wifi className="w-3 h-3 text-blue-400" />
          <span className="text-slate-400">IFACE:</span>
          <span className="text-slate-200 uppercase truncate max-w-[100px]">{monitorStatus.interface}</span>
        </div>

        {/* Active Model */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#131D31] border border-[#24324D]">
          <Cpu className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">MODEL:</span>
          <span className="text-slate-200 truncate max-w-[130px]">{activeModel}</span>
        </div>

        {/* Real-time UTC Clock */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#131D31] border border-[#24324D] text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-slate-200">{currentTime}</span>
        </div>

        {/* Security Incident Bell */}
        <Link
          to="/alerts"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#1E293B] border border-[#24324D] hover:border-rose-500 transition-colors"
          title="Security Incidents"
        >
          <Bell className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-400 font-bold">{unreadAlerts}</span>
        </Link>
      </div>
    </header>
  );
};
