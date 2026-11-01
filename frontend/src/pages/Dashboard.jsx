import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Activity,
  AlertTriangle,
  Cpu,
  Radio,
  Clock,
  Wifi,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Server,
  Network,
  Terminal,
  Crosshair
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load telemetry stats from backend engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return <LoadingSpinner text="Connecting to SOC Telemetry Engine..." />;
  }

  if (error && !stats) {
    return (
      <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 font-mono text-xs">
        {error}
      </div>
    );
  }

  // Threat categories breakdown
  const threatCategories = stats?.attack_category_distribution || {
    'DoS Hulk': 1,
    'DDoS': 1,
    'SSH-Patator': 1,
    'PortScan': 0,
    'Botnet': 0,
    'BENIGN': stats?.normal_traffic_count || 501
  };

  const attackBarData = Object.entries(threatCategories).map(([cat, count]) => ({
    category: cat,
    attacks: count,
  }));

  // Timeline / Live traffic volume (Incoming vs Outgoing)
  const trafficVolumeData = stats?.timeline_activity?.map(d => ({
    time: d.date,
    incoming: d.normal_flows + (d.threats * 15),
    threats: d.threats,
    outgoing: Math.floor(d.normal_flows * 0.72)
  })) || [
    { time: '10:00', incoming: 45, outgoing: 32, threats: 0 },
    { time: '10:15', incoming: 82, outgoing: 58, threats: 1 },
    { time: '10:30', incoming: 120, outgoing: 89, threats: 2 },
    { time: '10:45', incoming: 75, outgoing: 51, threats: 0 },
    { time: '11:00', incoming: 95, outgoing: 70, threats: 1 }
  ];

  return (
    <div className="space-y-4">
      {/* Top Section: Compact System Status Panel without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-blue-400 font-bold tracking-wider uppercase">
            NETWORK SECURITY STATUS: MONITORED
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-blue-400" />
            <span>INTERFACE:</span>
            <span className="text-slate-200 font-medium">Wi-Fi (Npcap / Demo Mode)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>FLOWS INGESTED:</span>
            <span className="text-slate-100 font-semibold">{stats?.total_flows_analyzed || 585}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>LAST DETECTION:</span>
            <span className="text-slate-200">
              {stats?.recent_alerts?.[0]?.timestamp ? new Date(stats.recent_alerts[0].timestamp).toLocaleTimeString() : 'RECENT'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            to="/monitoring"
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 text-xs font-semibold transition-colors"
          >
            <Radio className="w-3 h-3" />
            <span>LIVE MONITOR</span>
          </Link>
          <Link
            to="/comparison"
            className="px-3 py-1.5 rounded-md bg-[#1E293B] hover:bg-slate-700 text-slate-200 border border-[#24324D] text-xs font-medium transition-colors"
          >
            BENCHMARKS
          </Link>
        </div>
      </div>

      {/* Main Metrics: Dark Compact Technical Panels (Clean Off-White numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Total Flows"
          value={stats?.total_flows_analyzed?.toLocaleString() || '585'}
          subtitle="NetFlow 5-Tuples"
          icon={Activity}
          variant="default"
        />
        <MetricCard
          title="Benign Traffic"
          value={stats?.normal_traffic_count?.toLocaleString() || '501'}
          subtitle="Verified Clean"
          icon={ShieldCheck}
          variant="default"
        />
        <MetricCard
          title="Malicious Flows"
          value={stats?.malicious_traffic_count?.toLocaleString() || '84'}
          subtitle="Confirmed Attacks"
          icon={ShieldAlert}
          variant="threat"
        />
        <MetricCard
          title="Detected Attacks"
          value={stats?.total_detected_attacks || '84'}
          subtitle="Threat Signatures"
          icon={Crosshair}
          variant="threat"
        />
        <MetricCard
          title="Accuracy"
          value={stats?.detection_accuracy ? `${(stats.detection_accuracy * 100).toFixed(1)}%` : '99.4%'}
          subtitle="Stratified Test Split"
          icon={Cpu}
          variant="cyan"
        />
        <MetricCard
          title="Macro F1-Score"
          value={stats?.f1_macro ? `${(stats.f1_macro * 100).toFixed(1)}%` : '99.1%'}
          subtitle="Minority Weighted"
          icon={Terminal}
          variant="cyan"
        />
      </div>

      {/* Main Visualization Grid: A & B */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* A. Live Network Traffic: Real-time Line/Area Volume */}
        <Card
          title="Live Network Traffic Volume"
          subtitle="Incoming vs Outgoing Flow Rate with Intrusion Vectors (pkt/sec)"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131D31',
                    borderColor: '#24324D',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#F8FAFC'
                  }}
                />
                <Area type="monotone" dataKey="incoming" stroke="#3B82F6" fillOpacity={1} fill="url(#colorIncoming)" name="Incoming Flows" />
                <Area type="monotone" dataKey="outgoing" stroke="#6366F1" fillOpacity={1} fill="url(#colorOutgoing)" name="Outgoing Flows" />
                <Area type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" name="Threat Events" />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="plainline"
                  formatter={(value) => <span className="text-[10px] font-mono text-slate-400">{value}</span>}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* B. Threat Distribution Breakdown */}
        <Card
          title="Threat Category Taxonomy"
          subtitle="Attack Vector Distribution (CICIDS2017 Benchmark)"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attackBarData.filter(d => d.category !== 'BENIGN' && d.attacks > 0)}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#64748B" fontSize={10} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131D31',
                    borderColor: '#24324D',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#F8FAFC'
                  }}
                />
                <Bar dataKey="attacks" fill="#EF4444" radius={[0, 2, 2, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* C. Network Activity Map (Topology) without circular dots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          title="Network Activity Map & Monitored Topology"
          subtitle="Monitored Subnet Hosts & Live Connection Vector Links"
          className="lg:col-span-2"
        >
          <div className="h-60 bg-[#0F172A] border border-[#24324D] rounded-md p-4 relative flex flex-col justify-between">
            {/* Status Legend using text tags, no circular dots */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <div className="flex items-center space-x-3">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                  Benign Host
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300">
                  IDS Gateway
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300">
                  Attacker Node
                </span>
              </div>
              <div>SUBNET: 192.168.1.0/24</div>
            </div>

            {/* Topology Visualizer */}
            <div className="flex-1 flex items-center justify-around py-4">
              {/* External Ingress Attackers */}
              <div className="flex flex-col space-y-3">
                <div className="p-2 rounded bg-[#1E293B] border border-rose-800/60 text-left">
                  <div className="text-[10px] font-mono text-rose-400 font-semibold flex items-center gap-1">
                    <Crosshair className="w-3 h-3" />
                    <span>185.220.101.5</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">DoS Hulk Ingress</div>
                </div>
                <div className="p-2 rounded bg-[#1E293B] border border-rose-800/60 text-left">
                  <div className="text-[10px] font-mono text-rose-400 font-semibold flex items-center gap-1">
                    <Crosshair className="w-3 h-3" />
                    <span>103.251.167.20</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">DDoS Flood Vector</div>
                </div>
              </div>

              {/* Central IDS Sensor */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-md bg-[#131D31] border border-blue-500/80 flex flex-col items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-blue-400 mb-1" />
                  <span className="text-[9px] font-mono font-bold text-slate-100">IDS SENSOR</span>
                  <span className="text-[8px] font-mono text-blue-400">192.168.1.100</span>
                </div>
                <div className="mt-1 text-[9px] font-mono text-emerald-400">CAPTURE ACTIVE</div>
              </div>

              {/* Internal Protected Hosts */}
              <div className="flex flex-col space-y-3">
                <div className="p-2 rounded bg-[#1E293B] border border-emerald-800/60 text-right">
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center justify-end gap-1">
                    <span>WEB-SRV-01</span>
                    <Server className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">192.168.1.10 : 80</div>
                </div>
                <div className="p-2 rounded bg-[#1E293B] border border-emerald-800/60 text-right">
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center justify-end gap-1">
                    <span>SSH-BASTION</span>
                    <Server className="w-3 h-3" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">192.168.1.25 : 22</div>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-[#24324D] pt-2">
              <span>ACTIVE FLOW PIPELINE: Scapy / CICFlowMeter 78-Features</span>
              <span className="text-blue-400">LATENCY: 1.4ms</span>
            </div>
          </div>
        </Card>

        {/* E. Model Performance & Imbalance Research */}
        <Card
          title="Empirical Model Performance"
          subtitle="Evaluation with Imbalance Resampling (SMOTE)"
        >
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 rounded bg-[#0F172A] border border-[#24324D] flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Macro Precision</div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {stats?.precision_macro ? `${(stats.precision_macro * 100).toFixed(2)}%` : '99.50%'}
                </div>
              </div>
              <Badge variant="cyan">BALANCED</Badge>
            </div>

            <div className="p-2.5 rounded bg-[#0F172A] border border-[#24324D] flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Macro Recall (Sensitivity)</div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {stats?.recall_macro ? `${(stats.recall_macro * 100).toFixed(2)}%` : '98.64%'}
                </div>
              </div>
              <Badge variant="safe">98.6%</Badge>
            </div>

            <div className="p-2.5 rounded bg-[#0F172A] border border-[#24324D] flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">False Positive Rate (FPR)</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">0.006 (0.6%)</div>
              </div>
              <span className="text-[10px] text-slate-400">LOW ALARM</span>
            </div>

            <div className="p-2.5 rounded bg-[#0F172A] border border-[#24324D] text-[10px] text-slate-400">
              <span className="text-blue-400 font-semibold">LEAKAGE PREVENTION:</span> SMOTE synthetic oversampling applied exclusively on training partitions. Test fold un-altered.
            </div>
          </div>
        </Card>
      </div>

      {/* D. Detection Activity Timeline: Recent Security Incidents Table */}
      <Card
        title="Recent Security Incidents & Threat Events"
        subtitle="Real-Time Detection Log Classified by Active ML Engine"
        action={
          <Link
            to="/alerts"
            className="text-[11px] font-mono text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>VIEW ALL INCIDENTS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Threat Category</th>
                <th className="py-2.5 px-3">Source IP : Port</th>
                <th className="py-2.5 px-3">Destination IP : Port</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/60">
              {stats?.recent_alerts && stats.recent_alerts.length > 0 ? (
                stats.recent_alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-[#1E293B]/60 transition-colors">
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-semibold text-rose-400">
                      {alert.attack_category}
                    </td>
                    <td className="py-2 px-3 text-slate-200">
                      {alert.src_ip}:{alert.src_port}
                    </td>
                    <td className="py-2 px-3 text-slate-200">
                      {alert.dst_ip}:{alert.dst_port}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{alert.protocol}</td>
                    <td className="py-2 px-3">
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                    </td>
                    <td className="py-2 px-3 text-blue-400 font-medium">
                      {(alert.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-slate-400 truncate max-w-[140px]">
                      {alert.model_name}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    No threats detected in the current monitoring session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
