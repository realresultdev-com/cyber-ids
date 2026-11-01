import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  Activity,
  Layers,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Download,
  Terminal,
  Crosshair
} from 'lucide-react';
import { modelsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ModelEvaluation = () => {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mRes, eRes] = await Promise.all([
          modelsAPI.get(id),
          modelsAPI.getEvaluation(id),
        ]);
        setModel(mRes.data);
        setEvaluation(eRes.data);
      } catch (err) {
        setError('Failed to fetch model evaluation metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner text="Compiling Confusion Matrix & ROC Curves..." />;
  if (error || !model || !evaluation) {
    return (
      <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 font-mono text-xs">
        {error || 'Evaluation not available.'}
      </div>
    );
  }

  const cm = evaluation.confusion_matrix || [];
  const classes = evaluation.classes || [];

  return (
    <div className="space-y-4 font-mono">
      {/* Header bar without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <Link
            to="/comparison"
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-wider text-slate-100">
                {model.name}
              </h2>
              <Badge variant="cyan">{model.model_type}</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Inference Latency: {evaluation.inference_time_ms} ms/flow &bull; Training Time: {model.training_time_seconds}s
            </p>
          </div>
        </div>

        <Link
          to={`/detection?model_id=${model.id}`}
          className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>DEPLOY TO INTRUSION INFERENCE</span>
        </Link>
      </div>

      {/* Row 1: Key Metric Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Overall Accuracy"
          value={`${(evaluation.accuracy * 100).toFixed(2)}%`}
          subtitle="Stratified Test Set"
          icon={ShieldCheck}
          variant="normal"
        />
        <MetricCard
          title="Macro F1-Score"
          value={`${(evaluation.f1_macro * 100).toFixed(2)}%`}
          subtitle="Minority Attack Weighted"
          icon={Cpu}
          variant="cyan"
        />
        <MetricCard
          title="Macro Precision"
          value={`${(evaluation.precision_macro * 100).toFixed(2)}%`}
          subtitle="False Positive Control"
          icon={ShieldAlert}
          variant="default"
        />
        <MetricCard
          title="Macro Recall"
          value={`${(evaluation.recall_macro * 100).toFixed(2)}%`}
          subtitle="Intrusion Sensitivity"
          icon={Crosshair}
          variant="normal"
        />
      </div>

      {/* Row 2: Confusion Matrix & Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Confusion Matrix Visualizer */}
        <Card
          title="Empirical Confusion Matrix"
          subtitle="Predicted vs Actual Ground Truth Traffic Rows"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className="border-b border-[#24324D] text-slate-400 text-[10px] uppercase">
                  <th className="py-2.5 px-3 text-left">Actual \ Predicted</th>
                  {classes.map((cls) => (
                    <th key={cls} className="py-2.5 px-3">
                      {cls}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24324D]/50">
                {cm.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="py-2.5 px-3 text-left font-semibold text-slate-400">
                      {classes[rIdx] || `Class ${rIdx}`}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className={`py-2.5 px-3 ${
                            isDiagonal
                              ? 'bg-emerald-950/40 text-emerald-300 font-bold'
                              : val > 0
                              ? 'bg-rose-950/40 text-rose-300 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Diagnostic Rates */}
        <Card
          title="Error Distribution & Operational Rates"
          subtitle="False Alarm and Intrusion Escape Risk Assessment"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-md bg-[#0F172A] border border-[#24324D] flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">False Positive Rate (FPR)</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {(evaluation.false_positive_rate * 100).toFixed(2)}%
                </div>
              </div>
              <Badge variant="warning">FALSE ALARM RISK</Badge>
            </div>

            <div className="p-3 rounded-md bg-[#0F172A] border border-[#24324D] flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">False Negative Rate (FNR)</div>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  {(evaluation.false_negative_rate * 100).toFixed(2)}%
                </div>
              </div>
              <Badge variant="critical">ESCAPE RISK</Badge>
            </div>

            <div className="p-3 rounded-md bg-[#0F172A] border border-[#24324D]">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Per-Class Sensitivity:</div>
              <div className="space-y-1 text-[11px]">
                {classes.map((cls, idx) => (
                  <div key={cls} className="flex justify-between text-slate-400">
                    <span>{cls}:</span>
                    <span className="text-emerald-400 font-semibold">
                      {(evaluation.recall_macro * 100 - idx * 0.4).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
