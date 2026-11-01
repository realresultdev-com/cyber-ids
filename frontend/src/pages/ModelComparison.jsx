import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Zap,
  Info,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { modelsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ModelComparison = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const res = await modelsAPI.getComparison();
        setComparisons(res.data);
      } catch (err) {
        setError('Failed to fetch model comparison matrix.');
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, []);

  if (loading) return <LoadingSpinner text="Aggregating model benchmarks..." />;
  if (error) {
    return (
      <div className="p-4 bg-[#FF4057]/15 border border-[#FF4057]/40 rounded text-[#FF4057] font-mono text-xs">
        {error}
      </div>
    );
  }

  const chartData = comparisons.map((m) => ({
    name: m.name.length > 18 ? m.name.slice(0, 18) + '...' : m.name,
    'Macro F1': Number((m.f1_macro * 100).toFixed(1)),
    'Macro Recall': Number((m.recall_macro * 100).toFixed(1)),
    'Accuracy': Number((m.accuracy * 100).toFixed(1)),
  }));

  const bestModel = comparisons.length > 0 ? comparisons[0] : null;

  return (
    <div className="space-y-4 font-mono">
      {/* Header bar */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <span>EMPIRICAL MODEL BENCHMARK & RESEARCH COMPARISON MATRIX</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Baseline vs. SMOTE vs. Class-Weighted ML/DL Models &bull; Emphasizing Minority Attack Recall & Macro-F1
          </p>
        </div>
        <Link
          to="/training"
          className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-sm"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>TRAIN NEW MODEL</span>
        </Link>
      </div>

      {/* Best Model Highlight Card */}
      {bestModel && (
        <div className="p-4 bg-[#131D31] border border-blue-500/40 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-md bg-[#1E293B] border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                  OPTIMAL DETECTION PIPELINE (MACRO F1)
                </span>
                <Badge variant="info">{bestModel.imbalance_technique}</Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">{bestModel.name}</h3>
              <p className="text-[11px] text-slate-400">
                Inference Latency: {bestModel.inference_time_ms} ms &bull; Training Time: {bestModel.training_time_seconds}s
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-center">
            <div className="p-2 rounded-md bg-[#0F172A] border border-[#24324D] min-w-[75px]">
              <div className="text-[9px] text-slate-400 uppercase">Accuracy</div>
              <div className="text-sm font-bold text-slate-100">{(bestModel.accuracy * 100).toFixed(1)}%</div>
            </div>
            <div className="p-2 rounded-md bg-[#0F172A] border border-[#24324D] min-w-[75px]">
              <div className="text-[9px] text-slate-400 uppercase">Macro F1</div>
              <div className="text-sm font-bold text-slate-100">{(bestModel.f1_macro * 100).toFixed(1)}%</div>
            </div>
            <div className="p-2 rounded-md bg-[#0F172A] border border-[#24324D] min-w-[75px]">
              <div className="text-[9px] text-slate-400 uppercase">Recall</div>
              <div className="text-sm font-bold text-slate-100">{(bestModel.recall_macro * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Model Comparison Bar Chart */}
      <Card
        title="Comparative Empirical Evaluation (Stratified Test Data)"
        subtitle="Evaluating Macro F1 and Minority Recall across Imbalance Mitigation Strategies"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#8494AA" fontSize={10} tickLine={false} />
              <YAxis stroke="#8494AA" fontSize={10} domain={[85, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131D31',
                  borderColor: '#24324D',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#F8FAFC'
                }}
              />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Macro F1" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Macro Recall" fill="#10B981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Accuracy" fill="#64748B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Row 2: Comprehensive Evaluation Table */}
      <Card
        title="Comprehensive Metric Scorecard & Latency Profiles"
        subtitle="Empirical results table with false-alarm and intrusion-escape rates"
      >
        <div className="overflow-x-auto border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3">Imbalance Tech</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Precision (M)</th>
                <th className="py-2.5 px-3">Recall (M)</th>
                <th className="py-2.5 px-3">F1-Score (M)</th>
                <th className="py-2.5 px-3">FPR</th>
                <th className="py-2.5 px-3">FNR</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/60">
              {comparisons.map((m) => (
                <tr key={m.model_id} className="hover:bg-[#1E293B]/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-100">{m.name}</td>
                  <td className="py-2 px-3 text-blue-400">{m.model_type}</td>
                  <td className="py-2 px-3 text-amber-400">{m.imbalance_technique}</td>
                  <td className="py-2 px-3 text-slate-100">{(m.accuracy * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-slate-100">{(m.precision_macro * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-slate-100 font-semibold">{(m.recall_macro * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-blue-400 font-semibold">{(m.f1_macro * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-slate-400">{(m.false_positive_rate * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-rose-400">{(m.false_negative_rate * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-slate-400">{m.inference_time_ms} ms</td>
                  <td className="py-2 px-3 text-center">
                    <Link
                      to={`/models/${m.model_id}/evaluation`}
                      className="px-2 py-0.5 rounded bg-[#1E293B] hover:bg-slate-700 border border-[#24324D] text-[10px] text-slate-200"
                    >
                      MATRIX
                    </Link>
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
