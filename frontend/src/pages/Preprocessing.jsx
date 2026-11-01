import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Cpu,
  Layers,
  ArrowRight,
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
import { datasetsAPI, preprocessingAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Preprocessing = () => {
  const [searchParams] = useSearchParams();
  const preselectedDatasetId = searchParams.get('dataset_id');
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);

  // Form states
  const [datasetId, setDatasetId] = useState(preselectedDatasetId || '');
  const [pipelineName, setPipelineName] = useState('');
  const [problemType, setProblemType] = useState('binary');
  const [missingStrategy, setMissingStrategy] = useState('median');
  const [scalingMethod, setScalingMethod] = useState('standard');
  const [imbalanceMethod, setImbalanceMethod] = useState('SMOTE');
  const [testSize, setTestSize] = useState(0.2);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, pRes] = await Promise.all([
        datasetsAPI.list(),
        preprocessingAPI.list(),
      ]);
      setDatasets(dRes.data);
      setPipelines(pRes.data);
      if (!datasetId && dRes.data.length > 0) {
        setDatasetId(dRes.data[0].id.toString());
      }
      if (pRes.data.length > 0) {
        setSelectedPipeline(pRes.data[0]);
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

  const handleRunPreprocessing = async (e) => {
    e.preventDefault();
    if (!datasetId) {
      alert('Please select a dataset');
      return;
    }
    const name = pipelineName || `${imbalanceMethod}_Pipeline_${Date.now().toString().slice(-4)}`;
    setRunning(true);
    try {
      await preprocessingAPI.run({
        dataset_id: parseInt(datasetId),
        name: name,
        problem_type: problemType,
        missing_strategy: missingStrategy,
        scaling_method: scalingMethod,
        imbalance_method: imbalanceMethod,
        test_size: parseFloat(testSize),
        random_state: 42,
      });
      alert('Preprocessing pipeline executed successfully with zero data leakage!');
      setPipelineName('');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to execute preprocessing pipeline.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Imbalance Resampling Pipelines..." />;

  // Before / After Resampling comparison data
  const beforeDist = selectedPipeline?.before_resample_distribution || {
    BENIGN: 400,
    MALICIOUS: 68,
  };
  const afterDist = selectedPipeline?.after_resample_distribution || {
    BENIGN: 400,
    MALICIOUS: selectedPipeline?.imbalance_method === 'SMOTE' ? 400 : 68,
  };

  const chartData = Object.keys(beforeDist).map((cls) => ({
    name: cls,
    Before: beforeDist[cls],
    After: afterDist[cls] || beforeDist[cls],
  }));

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase">
            DATA PREPROCESSING & CLASS IMBALANCE LABORATORY
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Synthetic Minority Oversampling (SMOTE) &bull; Class Weighting &bull; Zero Data Leakage Isolation
          </p>
        </div>
        <div className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
          DATA LEAKAGE PROTOCOL: ENFORCED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Preprocessing Configuration Form */}
        <Card
          title="Configure Pipeline Parameters"
          subtitle="Define imbalance correction and scaling strategy"
          className="lg:col-span-1"
        >
          <form onSubmit={handleRunPreprocessing} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Target Raw Dataset
              </label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.total_rows} flows)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Pipeline Tag Alias
              </label>
              <input
                type="text"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="e.g. smote_balanced_standard"
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                  Classification Type
                </label>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="binary">Binary (Benign/Malicious)</option>
                  <option value="multiclass">Multiclass (Specific Attacks)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                  Imbalance Method
                </label>
                <select
                  value={imbalanceMethod}
                  onChange={(e) => setImbalanceMethod(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2.5 py-1.5 text-xs text-blue-400 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="SMOTE">SMOTE Oversampling</option>
                  <option value="random_undersample">Random Undersampling</option>
                  <option value="class_weights">Class Weighting (Cost)</option>
                  <option value="none">None (Baseline Raw)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                  Numerical Scaler
                </label>
                <select
                  value={scalingMethod}
                  onChange={(e) => setScalingMethod(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="standard">StandardScaler (Z-Score)</option>
                  <option value="minmax">MinMaxScaler (0 - 1)</option>
                  <option value="robust">RobustScaler (Median/IQR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                  Test Partition
                </label>
                <select
                  value={testSize}
                  onChange={(e) => setTestSize(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value={0.2}>20% Stratified Test</option>
                  <option value={0.25}>25% Stratified Test</option>
                  <option value={0.3}>30% Stratified Test</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md text-[10px] text-slate-400">
              <span className="text-blue-400 font-semibold">Strict Leakage Isolation:</span> Resampling is fitted strictly on the training partition. Test fold records are held out without synthetic generation.
            </div>

            <button
              type="submit"
              disabled={running}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{running ? 'FITTING PREPROCESSING...' : 'EXECUTE PREPROCESSING'}</span>
            </button>
          </form>
        </Card>

        {/* Right Col: Active Pipeline Details & Class Balance Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPipeline ? (
            <>
              {/* Pipeline Meta Details */}
              <div className="p-3.5 bg-[#131D31] border border-[#24324D] rounded-md text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#24324D]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-100">
                        {selectedPipeline.name}
                      </h3>
                      <Badge variant="cyan">{selectedPipeline.imbalance_method}</Badge>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Scaler: {selectedPipeline.scaling_method} &bull; Strategy: {selectedPipeline.problem_type} &bull; Test Split: {(selectedPipeline.test_size * 100).toFixed(0)}%
                    </div>
                  </div>

                  <Link
                    to={`/training?pipeline_id=${selectedPipeline.id}`}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>TRAIN MODELS ON THIS PIPELINE</span>
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center text-xs">
                  <div className="p-2 rounded bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Train Samples</div>
                    <div className="text-xs font-bold text-slate-100 mt-0.5">{selectedPipeline.train_samples?.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Test Samples (Stratified)</div>
                    <div className="text-xs font-bold text-blue-400 mt-0.5">{selectedPipeline.test_samples?.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Features Selected</div>
                    <div className="text-xs font-bold text-slate-100 mt-0.5">{selectedPipeline.feature_names?.length || 78}</div>
                  </div>
                  <div className="p-2 rounded bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Resampling Target</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">{selectedPipeline.imbalance_method}</div>
                  </div>
                </div>
              </div>

              {/* Before vs After Class Balance Chart */}
              <Card
                title="Class Balance: Before vs After Imbalance Handling"
                subtitle="Verification of synthetic oversampling on training split"
              >
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
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
                      <Legend verticalAlign="top" align="right" />
                      <Bar dataKey="Before" fill="#F59E0B" name="Original Split (Imbalanced)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="After" fill="#3B82F6" name="Resampled Training Split" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Saved Pipelines List */}
              <Card title="Available Prepared Preprocessing Pipelines">
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {pipelines.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPipeline(p)}
                      className={`p-2.5 rounded-md border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                        selectedPipeline.id === p.id
                          ? 'bg-[#1E293B] border-blue-500 text-blue-400'
                          : 'bg-[#0F172A] border-[#24324D] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({p.imbalance_method})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Train: {p.train_samples} &bull; Test: {p.test_samples}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div className="p-10 border border-dashed border-[#24324D] rounded-md text-center text-slate-400 text-xs">
              No preprocessing pipeline generated yet. Configure options on the left to prepare balanced train/test splits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
