import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Database,
  Hash,
  Layers,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { datasetsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DatasetDetails = () => {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setLoading(true);
        const res = await datasetsAPI.get(id);
        setDataset(res.data);
      } catch (err) {
        setError('Failed to load dataset details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
  }, [id]);

  if (loading) return <LoadingSpinner text="Dissecting Flow Features & Statistical Distributions..." />;
  if (error || !dataset) {
    return (
      <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 font-mono text-xs">
        {error || 'Dataset not found.'}
      </div>
    );
  }

  const classBarData = Object.entries(dataset.class_distribution || {}).map(([cls, count]) => ({
    name: cls,
    count: count,
  }));

  const counts = Object.values(dataset.class_distribution || {});
  const maxCount = Math.max(...counts, 1);
  const minCount = Math.min(...counts, 1);
  const imbalanceRatio = (maxCount / minCount).toFixed(1);

  return (
    <div className="space-y-4 font-mono">
      {/* Header bar without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <Link
            to="/datasets"
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-wider text-slate-100">
                {dataset.name}
              </h2>
              <Badge variant="cyan">{dataset.dataset_type}</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target Field: <span className="text-blue-400 font-semibold">{dataset.target_column}</span> &bull; Source File: {dataset.original_filename}
            </p>
          </div>
        </div>

        <Link
          to={`/preprocessing?dataset_id=${dataset.id}`}
          className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase flex items-center space-x-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>INITIALIZE PREPROCESSING PIPELINE</span>
        </Link>
      </div>

      {/* Row 1: Key Dimensions Panels (Clean Off-White numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md">
          <div className="text-[10px] uppercase text-slate-400">Total Flows (Rows)</div>
          <div className="text-lg font-bold text-slate-100 mt-1">{dataset.total_rows?.toLocaleString() || '--'}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Captured Flow Samples</div>
        </div>

        <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md">
          <div className="text-[10px] uppercase text-slate-400">Features Extracted</div>
          <div className="text-lg font-bold text-blue-400 mt-1">{dataset.total_columns || 78}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Flow 5-Tuple & Statistical</div>
        </div>

        <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md">
          <div className="text-[10px] uppercase text-slate-400">Imbalance Ratio</div>
          <div className="text-lg font-bold text-amber-400 mt-1">{imbalanceRatio} : 1</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Majority to Minority</div>
        </div>

        <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md">
          <div className="text-[10px] uppercase text-slate-400">Data Hygiene</div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {dataset.missing_values_count || 0} Nulls
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{dataset.duplicate_rows_count || 0} Duplicates Cleaned</div>
        </div>
      </div>

      {/* Row 2: Class Imbalance Histogram */}
      <Card
        title="Class Imbalance Distribution Profile"
        subtitle="Benchmark representation of majority benign flows vs rare intrusion attacks"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classBarData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
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
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {classBarData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'BENIGN' ? '#10B981' : '#EF4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Row 3: Preview Records Table */}
      <Card
        title="Raw Network Flow Preview (First 10 Records)"
        subtitle="Unprocessed feature vector snapshot"
      >
        <div className="overflow-x-auto max-h-72 border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                {dataset.preview_rows?.[0] &&
                  Object.keys(dataset.preview_rows[0]).map((col) => (
                    <th key={col} className="py-2 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/50">
              {dataset.preview_rows?.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1E293B]/60 transition-colors">
                  {Object.entries(row).map(([k, val], cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-1.5 px-3 whitespace-nowrap ${
                        k === dataset.target_column
                          ? val === 'BENIGN'
                            ? 'text-emerald-400 font-bold'
                            : 'text-rose-400 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
