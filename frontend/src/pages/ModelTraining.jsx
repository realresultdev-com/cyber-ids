import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sliders,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Terminal,
  Crosshair
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { preprocessingAPI, modelsAPI, trainingAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ModelTraining = () => {
  const [searchParams] = useSearchParams();
  const preselectedPrepId = searchParams.get('preprocessing_id');

  const [pipelines, setPipelines] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);

  const [preprocessingId, setPreprocessingId] = useState(preselectedPrepId || '');
  const [modelType, setModelType] = useState('RANDOM_FOREST');
  const [modelName, setModelName] = useState('');

  // Hyperparameters
  const [rfTrees, setRfTrees] = useState(100);
  const [rfDepth, setRfDepth] = useState(12);
  const [xgbTrees, setXgbTrees] = useState(100);
  const [xgbLr, setXgbLr] = useState(0.1);
  const [annEpochs, setAnnEpochs] = useState(15);
  const [annBatch, setAnnBatch] = useState(64);
  const [lstmEpochs, setLstmEpochs] = useState(10);
  const [lstmSeqLen, setLstmSeqLen] = useState(5);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        preprocessingAPI.list(),
        modelsAPI.list(),
      ]);
      setPipelines(pRes.data);
      setModels(mRes.data);
      if (!preprocessingId && pRes.data.length > 0) {
        setPreprocessingId(pRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (activeJobId) {
      interval = setInterval(async () => {
        try {
          const res = await trainingAPI.getStatus(activeJobId);
          setTrainingStatus(res.data);
          if (res.data.status === 'TRAINED' || res.data.status === 'FAILED') {
            setTraining(false);
            setActiveJobId(null);
            fetchData();
          }
        } catch (err) {
          console.error(err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeJobId]);

  const handleStartTraining = async (e) => {
    e.preventDefault();
    if (!preprocessingId) {
      alert('Please select a preprocessed pipeline.');
      return;
    }

    const payload = {
      preprocessing_id: parseInt(preprocessingId),
      model_type: modelType,
      name: modelName || `${modelType}_${Date.now().toString().slice(-4)}`,
      hyperparameters: {},
    };

    if (modelType === 'RANDOM_FOREST') {
      payload.hyperparameters = { n_estimators: parseInt(rfTrees), max_depth: parseInt(rfDepth) };
    } else if (modelType === 'XGBOOST') {
      payload.hyperparameters = { n_estimators: parseInt(xgbTrees), learning_rate: parseFloat(xgbLr) };
    } else if (modelType === 'ANN') {
      payload.hyperparameters = { epochs: parseInt(annEpochs), batch_size: parseInt(annBatch) };
    } else if (modelType === 'LSTM') {
      payload.hyperparameters = { epochs: parseInt(lstmEpochs), sequence_length: parseInt(lstmSeqLen) };
    }

    setTraining(true);
    try {
      const res = await trainingAPI.start(payload);
      setActiveJobId(res.data.id);
      setTrainingStatus(res.data);
      setModelName('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start model training.');
      setTraining(false);
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving ML & DL Model Registry..." />;

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase">
            MACHINE LEARNING & DEEP LEARNING MODEL LABORATORY
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Train Class-Balanced Classifiers (Random Forest, XGBoost, Decision Tree, ANN, LSTM) on Preprocessed Flow Splits
          </p>
        </div>
        <div className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
          TRAINING ENGINE: MULTI-CORE WORKER READY
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Hyperparameter Form */}
        <Card
          title="Model Architecture & Training Spec"
          subtitle="Select algorithm and configure hyperparameters"
          className="lg:col-span-1"
        >
          <form onSubmit={handleStartTraining} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Preprocessed Data Pipeline
              </label>
              <select
                value={preprocessingId}
                onChange={(e) => setPreprocessingId(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.imbalance_method}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Detection Algorithm
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-blue-400 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="RANDOM_FOREST">Random Forest (Ensemble)</option>
                <option value="XGBOOST">XGBoost (Gradient Boosted Trees)</option>
                <option value="DECISION_TREE">Decision Tree (CART)</option>
                <option value="ANN">Artificial Neural Network (MLP / PyTorch)</option>
                <option value="LSTM">Long Short-Term Memory (Sequential / PyTorch)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Model Identifier Alias
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder={`e.g. ${modelType.toLowerCase()}_balanced_v1`}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Hyperparameter Inputs */}
            {modelType === 'RANDOM_FOREST' && (
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0F172A] rounded-md border border-[#24324D]">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">N Estimators</label>
                  <input
                    type="number"
                    value={rfTrees}
                    onChange={(e) => setRfTrees(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Max Depth</label>
                  <input
                    type="number"
                    value={rfDepth}
                    onChange={(e) => setRfDepth(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            {modelType === 'XGBOOST' && (
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0F172A] rounded-md border border-[#24324D]">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">N Estimators</label>
                  <input
                    type="number"
                    value={xgbTrees}
                    onChange={(e) => setXgbTrees(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Learning Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={xgbLr}
                    onChange={(e) => setXgbLr(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            {modelType === 'ANN' && (
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0F172A] rounded-md border border-[#24324D]">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Epochs</label>
                  <input
                    type="number"
                    value={annEpochs}
                    onChange={(e) => setAnnEpochs(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Batch Size</label>
                  <input
                    type="number"
                    value={annBatch}
                    onChange={(e) => setAnnBatch(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            {modelType === 'LSTM' && (
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0F172A] rounded-md border border-[#24324D]">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Epochs</label>
                  <input
                    type="number"
                    value={lstmEpochs}
                    onChange={(e) => setLstmEpochs(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Seq Window (L)</label>
                  <input
                    type="number"
                    value={lstmSeqLen}
                    onChange={(e) => setLstmSeqLen(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#24324D] rounded p-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={training}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{training ? 'TRAINING IN BACKGROUND...' : 'LAUNCH TRAINING JOB'}</span>
            </button>
          </form>
        </Card>

        {/* Right Col: Live Training History & Active Models */}
        <div className="lg:col-span-2 space-y-4">
          {trainingStatus && (
            <div className="p-3.5 bg-[#131D31] border border-blue-500/40 rounded-md text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-slate-100">
                    JOB STATUS: {trainingStatus.status}
                  </span>
                </div>
                {trainingStatus.val_accuracy > 0 && (
                  <span className="text-emerald-400 font-bold">
                    Validation Accuracy: {(trainingStatus.val_accuracy * 100).toFixed(2)}%
                  </span>
                )}
              </div>

              {trainingStatus.history && trainingStatus.history.length > 0 && (
                <div className="h-40 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingStatus.history}>
                      <XAxis dataKey="epoch" stroke="#64748B" fontSize={10} />
                      <YAxis stroke="#64748B" fontSize={10} />
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
                      <Legend verticalAlign="top" />
                      <Line type="monotone" dataKey="train_loss" stroke="#EF4444" name="Train Loss" dot={false} />
                      <Line type="monotone" dataKey="val_loss" stroke="#3B82F6" name="Validation Loss" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Trained Models Table */}
          <Card
            title="Trained Model Registry"
            subtitle="Persistent serialized ML & DL models ready for real-time inference"
          >
            <div className="overflow-x-auto border border-[#24324D] rounded-md">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Model Name</th>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Imbalance Fix</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Macro F1</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24324D]/50">
                  {models.map((m) => (
                    <tr key={m.id} className="hover:bg-[#1E293B]/60 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-200">{m.name}</td>
                      <td className="py-2 px-3 text-blue-400">{m.model_type}</td>
                      <td className="py-2 px-3 text-amber-400">{m.imbalance_method || 'SMOTE'}</td>
                      <td className="py-2 px-3 text-slate-100">
                        {m.val_accuracy ? `${(m.val_accuracy * 100).toFixed(1)}%` : '--'}
                      </td>
                      <td className="py-2 px-3 text-blue-400 font-bold">
                        {m.val_f1_macro ? `${(m.val_f1_macro * 100).toFixed(1)}%` : '--'}
                      </td>
                      <td className="py-2 px-3 text-emerald-400">
                        {m.val_recall_macro ? `${(m.val_recall_macro * 100).toFixed(1)}%` : '--'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={m.status === 'TRAINED' ? 'safe' : 'warning'}>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Link
                          to={`/models/${m.id}/evaluation`}
                          className="px-2 py-0.5 rounded bg-[#1E293B] hover:bg-slate-700 border border-[#24324D] text-[10px] text-blue-400"
                        >
                          EVALUATE
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
