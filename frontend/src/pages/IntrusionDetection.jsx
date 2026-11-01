import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Upload,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Crosshair
} from 'lucide-react';
import { detectionAPI, modelsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const IntrusionDetection = () => {
  const [searchParams] = useSearchParams();
  const preselectedModelId = searchParams.get('model_id');

  const [models, setModels] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Form states
  const [selectedModelId, setSelectedModelId] = useState(preselectedModelId || '');
  const [jobName, setJobName] = useState('');
  const [file, setFile] = useState(null);

  // Table filtering & pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [maliciousOnly, setMaliciousOnly] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, jRes] = await Promise.all([
        modelsAPI.list(),
        detectionAPI.listJobs(),
      ]);
      setModels(mRes.data);
      setJobs(jRes.data);
      if (!selectedModelId && mRes.data.length > 0) {
        setSelectedModelId(mRes.data[0].id.toString());
      }
      if (jRes.data.length > 0) {
        fetchJobDetails(jRes.data[0].id, 1, search, maliciousOnly);
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

  const fetchJobDetails = async (jobId, pageNum = 1, searchQuery = '', onlyMalicious = false) => {
    try {
      const res = await detectionAPI.getJob(jobId, {
        page: pageNum,
        limit: 50,
        search: searchQuery || undefined,
        malicious_only: onlyMalicious,
      });
      setActiveJob(res.data.job);
      setRecords(res.data.records);
      setTotalRecords(res.data.total_records);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load job details', err);
    }
  };

  const handleRunDetection = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an unseen network traffic CSV file.');
      return;
    }
    if (!selectedModelId) {
      alert('Please select a trained model.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', selectedModelId);
    formData.append('job_name', jobName || `Audit_Scan_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

    setRunning(true);
    try {
      const res = await detectionAPI.run(formData);
      alert('Intrusion detection completed successfully!');
      setJobName('');
      setFile(null);
      await fetchData();
      if (res.data?.id) {
        fetchJobDetails(res.data.id, 1, '', false);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to execute detection.');
    } finally {
      setRunning(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (activeJob) {
      fetchJobDetails(activeJob.id, 1, val, maliciousOnly);
    }
  };

  const handleFilterToggle = () => {
    const nextVal = !maliciousOnly;
    setMaliciousOnly(nextVal);
    if (activeJob) {
      fetchJobDetails(activeJob.id, 1, search, nextVal);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to Intrusion Classification Engine..." />;

  return (
    <div className="space-y-4">
      {/* Header bar without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase">
            OFFLINE BATCH INTRUSION DETECTION ENGINE
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Execute High-Throughput Inference on Unseen CSV Flow Captures Using Pretrained ML & DL Pipelines
          </p>
        </div>
        <div className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
          STATUS: INFERENCE SUBSYSTEM READY
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Run Detection Form */}
        <Card
          title="Initiate Detection Scan"
          subtitle="Upload unlabelled traffic CSV & execute model"
          className="lg:col-span-1"
        >
          <form onSubmit={handleRunDetection} className="space-y-3.5 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Target Detection Model
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} [{m.model_type}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Scan Job Identifier
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g. DMZ_Audit_Inference_01"
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Network Flow Capture (.csv)
              </label>
              <input
                type="file"
                required
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md p-2 text-xs text-slate-400 file:mr-2.5 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-mono file:bg-[#1E293B] file:text-blue-400 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={running}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{running ? 'EXECUTING INFERENCE...' : 'RUN INTRUSION DETECTION'}</span>
            </button>
          </form>

          {/* Previous Scan History List */}
          <div className="mt-5 pt-4 border-t border-[#24324D]">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Previous Scan Jobs
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => fetchJobDetails(j.id, 1, search, maliciousOnly)}
                  className={`p-2.5 rounded-md border cursor-pointer transition-colors ${
                    activeJob?.id === j.id
                      ? 'bg-[#1E293B] border-blue-500 text-blue-400'
                      : 'bg-[#0F172A] border-[#24324D] text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{j.job_name}</div>
                  <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                    <span>{j.total_flows} flows</span>
                    <span className="text-rose-400 font-semibold">{j.malicious_count} threats</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right Col: Active Job Results & Filterable Records Table */}
        <div className="lg:col-span-2 space-y-4">
          {activeJob ? (
            <>
              {/* Job Summary Banner (Clean Off-White numbers) */}
              <div className="p-3.5 bg-[#131D31] border border-[#24324D] rounded-md font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#24324D]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{activeJob.job_name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Model: <span className="text-blue-400 font-semibold">{activeJob.model_name}</span> &bull; Duration: {activeJob.duration_seconds}s
                    </p>
                  </div>
                  <a
                    href={`/api/detection/jobs/${activeJob.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-slate-700 text-blue-400 border border-[#24324D] flex items-center space-x-1.5 text-xs font-semibold self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT CSV REPORT</span>
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3 text-center">
                  <div className="p-2 bg-[#0F172A] rounded border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Total Flows</div>
                    <div className="text-sm font-bold text-slate-100">{activeJob.total_flows}</div>
                  </div>
                  <div className="p-2 bg-[#0F172A] rounded border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Benign Normal</div>
                    <div className="text-sm font-bold text-slate-100">{activeJob.normal_count}</div>
                  </div>
                  <div className="p-2 bg-rose-950/30 rounded border border-rose-800/50">
                    <div className="text-[9px] text-rose-300 uppercase">Intrusions Intercepted</div>
                    <div className="text-sm font-bold text-rose-400">{activeJob.malicious_count}</div>
                  </div>
                </div>
              </div>

              {/* Records Filter & Search Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search IP, Port, or Threat Category..."
                    className="w-full bg-[#0F172A] border border-[#24324D] rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFilterToggle}
                  className={`px-3 py-1.5 rounded-md border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    maliciousOnly
                      ? 'bg-rose-950/50 border-rose-800/60 text-rose-300'
                      : 'bg-[#131D31] border-[#24324D] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{maliciousOnly ? 'SHOWING THREATS ONLY' : 'FILTER THREATS ONLY'}</span>
                </button>
              </div>

              {/* Individual Predictions Table */}
              <div className="bg-[#131D31] border border-[#24324D] rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Flow ID</th>
                        <th className="py-2.5 px-3">Source IP:Port</th>
                        <th className="py-2.5 px-3">Destination IP:Port</th>
                        <th className="py-2.5 px-3">Protocol</th>
                        <th className="py-2.5 px-3">Predicted Class</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24324D]/50">
                      {records.length > 0 ? (
                        records.map((rec) => {
                          const isThreat = rec.is_malicious;
                          return (
                            <tr
                              key={rec.id}
                              className={`transition-colors ${
                                isThreat
                                  ? 'bg-rose-950/30 hover:bg-rose-950/40 border-l-2 border-rose-500'
                                  : 'hover:bg-[#1E293B]/60'
                              }`}
                            >
                              <td className="py-2 px-3 text-slate-400">{rec.id}</td>
                              <td className="py-2 px-3 text-slate-200 font-semibold">{rec.src_ip}:{rec.src_port}</td>
                              <td className="py-2 px-3 text-slate-200 font-semibold">{rec.dst_ip}:{rec.dst_port}</td>
                              <td className="py-2 px-3 text-blue-400">{rec.protocol}</td>
                              <td className="py-2 px-3">
                                <span className={isThreat ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                                  {rec.predicted_label}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-blue-400 font-medium">
                                {(rec.confidence * 100).toFixed(1)}%
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant={isThreat ? 'critical' : 'safe'}>
                                  {isThreat ? 'MALICIOUS' : 'BENIGN'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No flow records matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-2.5 bg-[#0F172A] border-t border-[#24324D] flex items-center justify-between text-xs font-mono text-slate-400">
                  <div>
                    Records {records.length} of {totalRecords}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => fetchJobDetails(activeJob.id, page - 1, search, maliciousOnly)}
                      className="px-2.5 py-1 bg-[#1E293B] border border-[#24324D] rounded text-slate-200 disabled:opacity-40 cursor-pointer"
                    >
                      PREV
                    </button>
                    <span className="px-2.5 py-1 text-blue-400">PAGE {page}</span>
                    <button
                      disabled={records.length < 50}
                      onClick={() => fetchJobDetails(activeJob.id, page + 1, search, maliciousOnly)}
                      className="px-2.5 py-1 bg-[#1E293B] border border-[#24324D] rounded text-slate-200 disabled:opacity-40 cursor-pointer"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 border border-dashed border-[#24324D] rounded-md text-center text-slate-400 font-mono text-xs">
              No active intrusion detection job selected. Choose a scan from history or upload a new capture CSV.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
