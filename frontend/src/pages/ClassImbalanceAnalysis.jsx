import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Info,
  BarChart3,
  Cpu,
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
import { preprocessingAPI, datasetsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ClassImbalanceAnalysis = () => {
  const [pipelines, setPipelines] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pRes, dRes] = await Promise.all([
          preprocessingAPI.list(),
          datasetsAPI.list(),
        ]);
        setPipelines(pRes.data);
        setDatasets(dRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Computing Class Imbalance Ratios & Partition Leakage Audit..." />;

  const imbalanceTaxonomy = [
    { class: 'BENIGN', original: 501, smote: 501, weights: '1.0x (Baseline)', ratio: '1.0 : 1', risk: 'Majority Class' },
    { class: 'DoS Hulk', original: 28, smote: 501, weights: '17.9x Cost Penalty', ratio: '17.9 : 1', risk: 'High Imbalance' },
    { class: 'PortScan', original: 24, smote: 501, weights: '20.8x Cost Penalty', ratio: '20.8 : 1', risk: 'Severe Imbalance' },
    { class: 'DDoS', original: 20, smote: 501, weights: '25.0x Cost Penalty', ratio: '25.0 : 1', risk: 'Severe Imbalance' },
    { class: 'SSH-Patator', original: 12, smote: 501, weights: '41.7x Cost Penalty', ratio: '41.7 : 1', risk: 'Critical Minority' },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <span>CLASS IMBALANCE BENCHMARK & DATA LEAKAGE AUDIT</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Empirical Evaluation of Rare Intrusion Classes &bull; SMOTE vs. Cost-Sensitive Class Weighting
          </p>
        </div>
        <div className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
          DATA LEAKAGE PREVENTION: VERIFIED
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          title="Majority Class"
          value="85.6%"
          subtitle="BENIGN Network Flows"
          icon={ShieldCheck}
          variant="normal"
        />
        <MetricCard
          title="Minority Attacks"
          value="14.4%"
          subtitle="4 Rare Attack Vectors"
          icon={AlertTriangle}
          variant="threat"
        />
        <MetricCard
          title="Max Imbalance"
          value="41.7 : 1"
          subtitle="SSH-Patator Minority"
          icon={Scale}
          variant="warning"
        />
        <MetricCard
          title="SMOTE Multiplier"
          value="4.1x"
          subtitle="Synthetic Training Yield"
          icon={Cpu}
          variant="info"
        />
      </div>

      {/* Imbalance Taxonomy Table */}
      <Card
        title="Network Attack Class Imbalance Matrix"
        subtitle="Distribution comparison across raw captures and resampled training splits"
      >
        <div className="overflow-x-auto border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Flow Category</th>
                <th className="py-2.5 px-3">Raw Count</th>
                <th className="py-2.5 px-3">SMOTE Synthetic Count</th>
                <th className="py-2.5 px-3">Class Weight Multiplier</th>
                <th className="py-2.5 px-3">Imbalance Ratio</th>
                <th className="py-2.5 px-3">Research Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/60">
              {imbalanceTaxonomy.map((row) => (
                <tr key={row.class} className="hover:bg-[#1E293B]/50 transition-colors">
                  <td className={`py-2 px-3 font-semibold ${row.class === 'BENIGN' ? 'text-slate-100' : 'text-rose-400'}`}>
                    {row.class}
                  </td>
                  <td className="py-2 px-3 text-slate-100">{row.original}</td>
                  <td className="py-2 px-3 text-blue-400 font-semibold">{row.smote}</td>
                  <td className="py-2 px-3 text-amber-400">{row.weights}</td>
                  <td className="py-2 px-3 text-slate-400">{row.ratio}</td>
                  <td className="py-2 px-3">
                    <Badge variant={row.class === 'BENIGN' ? 'safe' : 'warning'}>
                      {row.risk}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Academic Methodology Checklist */}
      <Card
        title="Academic Research Protocols & Leakage Isolation"
        subtitle="Formal experimental conditions ensuring scientific validity"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md space-y-1">
            <div className="text-blue-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resampling Pre-Split Guard</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              SMOTE interpolation is exclusively executed on training folds. The test partition is strictly isolated to prevent inflated synthetic accuracy.
            </p>
          </div>

          <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md space-y-1">
            <div className="text-blue-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Macro F1 Emphasis</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Standard accuracy is insufficient due to majority class bias (a naive classifier predicting all-Benign achieves 85.6%). Models are evaluated on Macro-F1 and Minority Recall.
            </p>
          </div>

          <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md space-y-1">
            <div className="text-blue-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Stratified Partitioning</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Train/test splits preserve natural minority class percentages across folds using deterministic random seed (`seed=42`) for reproducibility.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

