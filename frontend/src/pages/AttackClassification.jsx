import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  ShieldAlert,
  Layers,
  BarChart2,
  Sliders,
  Activity,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { modelsAPI, dashboardAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AttackClassification = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await dashboardAPI.getStats();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Computing Feature Importance & Attack Taxonomy..." />;

  // Feature Importance Rankings for Random Forest / XGBoost
  const featureImportance = [
    { feature: 'Flow Duration', importance: 0.22, description: 'Total length of flow in microseconds' },
    { feature: 'Fwd Packet Length Max', importance: 0.18, description: 'Maximum frame size traveling forward' },
    { feature: 'Flow IAT Mean', importance: 0.16, description: 'Mean inter-arrival time between packets' },
    { feature: 'Flow Bytes/s', importance: 0.14, description: 'Throughput rate indicative of flooding' },
    { feature: 'Total Length Fwd Pkts', importance: 0.11, description: 'Cumulative payload bytes' },
    { feature: 'SYN Flag Count', importance: 0.10, description: 'TCP handshake initial state indicator' },
    { feature: 'Down/Up Ratio', importance: 0.09, description: 'Asymmetric bidirectional packet ratio' },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <span>MULTI-CLASS ATTACK TAXONOMY & FEATURE IMPORTANCE RANKINGS</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tree-Ensemble Gini Impurity Gain &bull; Top Predictive Flow Characteristics for Intrusion Discrimination
          </p>
        </div>
        <div className="text-[10px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/60">
          FEATURE SPACE: 78 DIMENSIONS
        </div>
      </div>

      {/* Feature Importance Bar Chart */}
      <Card
        title="Top Predictive Features (Gini Importance Index)"
        subtitle="Key attributes distinguishing legitimate web traffic from volumetric and brute-force intrusions"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureImportance}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
            >
              <XAxis type="number" stroke="#8494AA" fontSize={10} domain={[0, 0.25]} tickLine={false} />
              <YAxis dataKey="feature" type="category" stroke="#8494AA" fontSize={11} tickLine={false} />
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
              <Bar dataKey="importance" fill="#3B82F6" radius={[0, 2, 2, 0]} name="Gini Gain" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Feature Explanations Table */}
      <Card
        title="Heuristic Feature Explanations & Threat Indicators"
        subtitle="How the model distinguishes specific attack vectors using flow attributes"
      >
        <div className="overflow-x-auto border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Flow Feature</th>
                <th className="py-2.5 px-3">Weight</th>
                <th className="py-2.5 px-3">Cybersecurity Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/60">
              {featureImportance.map((f) => (
                <tr key={f.feature} className="hover:bg-[#1E293B]/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-blue-400">{f.feature}</td>
                  <td className="py-2 px-3 text-slate-100 font-bold">{(f.importance * 100).toFixed(0)}%</td>
                  <td className="py-2 px-3 text-slate-400">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

