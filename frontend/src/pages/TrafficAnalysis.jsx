import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  Activity,
  Layers,
  Radio,
  Filter,
  Download,
  Wifi,
  Server,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
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
  Legend
} from 'recharts';
import { monitoringAPI, dashboardAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TrafficAnalysis = () => {
  const [liveData, setLiveData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [liveRes, statsRes] = await Promise.all([
          monitoringAPI.getLive().catch(() => ({ data: {} })),
          dashboardAPI.getStats().catch(() => ({ data: {} })),
        ]);
        setLiveData(liveRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Aggregating Flow Protocol Telemetry..." />;

  // Protocol Volume Distribution
  const protocolData = [
    { name: 'TCP', count: 485, color: '#3B82F6' },
    { name: 'UDP', count: 96, color: '#6366F1' },
    { name: 'ICMP', count: 24, color: '#F59E0B' },
  ];

  // TCP Flag Distribution
  const tcpFlagsData = [
    { flag: 'SYN', count: 184, threat: 'High (Syn-Flood Risk)' },
    { flag: 'ACK', count: 462, threat: 'Normal (Established)' },
    { flag: 'FIN', count: 140, threat: 'Normal (Teardown)' },
    { flag: 'RST', count: 58, threat: 'Suspicious (Abrupt Term)' },
    { flag: 'PSH', count: 298, threat: 'Normal (Data Push)' },
  ];

  // Top IP Flow Pairings
  const topFlows = [
    { src: '185.220.101.5:44321', dst: '192.168.1.100:80', proto: 'TCP', pkts: 85, bytes: '124.8 KB', status: 'DoS Hulk Vector', threat: true },
    { src: '103.251.167.20:61002', dst: '192.168.1.100:8080', proto: 'TCP', pkts: 120, bytes: '188.4 KB', status: 'DDoS Flood Ingress', threat: true },
    { src: '198.51.100.42:52104', dst: '192.168.1.100:22', proto: 'TCP', pkts: 42, bytes: '18.2 KB', status: 'SSH-Patator Sweeper', threat: true },
    { src: '192.168.1.10:52140', dst: '8.8.8.8:53', proto: 'UDP', pkts: 2, bytes: '184 B', status: 'DNS Resolution', threat: false },
    { src: '192.168.1.25:443', dst: '142.250.190.46:443', proto: 'TCP', pkts: 34, bytes: '42.6 KB', status: 'HTTPS Outbound', threat: false },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <span>STATISTICAL NETWORK TRAFFIC & FLOW DECOMPOSITION</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Protocol Breakdown &bull; TCP State Flags &bull; Flow IAT &bull; Top Conversational Bandwidth Pairs
          </p>
        </div>
        <div className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
          PROMISCUOUS FLOW ENGINE: ACTIVE
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          title="Monitored Bandwidth"
          value="48.2 MB/s"
          subtitle="Cumulative Ingress + Egress"
          icon={Activity}
          variant="info"
        />
        <MetricCard
          title="TCP Sessions"
          value="485"
          subtitle="80.2% Total Volume"
          icon={Server}
          variant="default"
        />
        <MetricCard
          title="UDP Datagrams"
          value="96"
          subtitle="15.8% DNS / Media"
          icon={Radio}
          variant="default"
        />
        <MetricCard
          title="Flag Anomaly Score"
          value="0.14"
          subtitle="Abnormal RST/SYN Ratio"
          icon={Zap}
          variant="warning"
        />
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Protocol Pie */}
        <Card title="Transport Protocol Ratio" subtitle="Layer-4 Payload Distribution">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131D31',
                    borderColor: '#24324D',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#F8FAFC',
                  }}
                />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* TCP Flags Bar */}
        <Card
          title="TCP Control Flag Distribution"
          subtitle="Active SYN/ACK handshake telemetry & anomalous sweeps"
          className="lg:col-span-2"
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tcpFlagsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <XAxis dataKey="flag" stroke="#8494AA" fontSize={11} tickLine={false} />
                <YAxis stroke="#8494AA" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131D31',
                    borderColor: '#24324D',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Communicating Conversations */}
      <Card
        title="Top Conversational Network Pairs (5-Tuple Bandwidth Matrix)"
        subtitle="Active flow endpoints with real-time heuristic anomaly tagging"
      >
        <div className="overflow-x-auto border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Source Endpoint</th>
                <th className="py-2.5 px-3">Destination Endpoint</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Packets</th>
                <th className="py-2.5 px-3">Data Transferred</th>
                <th className="py-2.5 px-3">Traffic Classification</th>
                <th className="py-2.5 px-3">Threat State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/60">
              {topFlows.map((f, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    f.threat
                      ? 'bg-rose-950/20 hover:bg-rose-950/30 border-l-2 border-rose-500'
                      : 'hover:bg-[#1E293B]/50'
                  }`}
                >
                  <td className="py-2 px-3 text-slate-100 font-semibold">{f.src}</td>
                  <td className="py-2 px-3 text-slate-100 font-semibold">{f.dst}</td>
                  <td className="py-2 px-3 text-blue-400">{f.proto}</td>
                  <td className="py-2 px-3 text-slate-400">{f.pkts}</td>
                  <td className="py-2 px-3 text-slate-100 font-medium">{f.bytes}</td>
                  <td className="py-2 px-3 font-semibold text-rose-400">{f.status}</td>
                  <td className="py-2 px-3">
                    <Badge variant={f.threat ? 'critical' : 'safe'}>
                      {f.threat ? 'ANOMALOUS' : 'CLEAN'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

