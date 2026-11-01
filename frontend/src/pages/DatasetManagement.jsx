import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Upload,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Database,
  ArrowRight,
  HardDrive,
  Sliders,
  Scale
} from 'lucide-react';
import { datasetsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const DatasetManagement = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await datasetsAPI.list();
      setDatasets(res.data);
    } catch (err) {
      setError('Failed to fetch dataset catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a CSV dataset file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || file.name.replace('.csv', ''));

    setUploading(true);
    try {
      await datasetsAPI.upload(formData);
      setUploadModalOpen(false);
      setName('');
      setFile(null);
      fetchDatasets();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, datasetName) => {
    if (!window.confirm(`Are you sure you want to permanently delete dataset "${datasetName}"?`)) {
      return;
    }
    try {
      await datasetsAPI.delete(id);
      fetchDatasets();
    } catch (err) {
      alert('Failed to delete dataset.');
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving Network Dataset Catalog..." />;

  return (
    <div className="space-y-4">
      {/* Top Banner without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase">
            CYBERSECURITY DATASET LABORATORY
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Network Flow Benchmarks: CICIDS2017, CSE-CIC-IDS2018, UNSW-NB15 &bull; Imbalance Verification
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>UPLOAD CSV DATASET</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 font-mono text-xs">
          {error}
        </div>
      )}

      {/* Dataset Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((ds) => {
          const isCicids = ds.name.includes('CICIDS2017');
          return (
            <div
              key={ds.id}
              className="bg-[#131D31] border border-[#24324D] rounded-md p-4 flex flex-col justify-between font-mono text-xs hover:border-blue-500/60 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="cyan">
                    {isCicids ? 'CICIDS2017' : 'NETWORK CSV'}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ds.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mt-2 truncate">
                  {ds.name}
                </h3>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {ds.filename}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 rounded bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Rows</div>
                    <div className="text-xs font-bold text-slate-100 mt-0.5">{ds.total_rows?.toLocaleString() || '--'}</div>
                  </div>
                  <div className="p-2 rounded bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">Features</div>
                    <div className="text-xs font-bold text-blue-400 mt-0.5">{ds.total_columns || 78}</div>
                  </div>
                  <div className="p-2 rounded bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[9px] text-slate-400 uppercase">File Size</div>
                    <div className="text-xs font-bold text-slate-100 mt-0.5">{(ds.file_size_bytes / 1024).toFixed(1)} KB</div>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-between border-t border-[#24324D] pt-2">
                  <span>Class Imbalance:</span>
                  <span className="text-amber-400 font-semibold">High (1 : 5.95)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#24324D] flex items-center justify-between">
                <Link
                  to={`/datasets/${ds.id}`}
                  className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-slate-700 text-blue-400 border border-[#24324D] text-xs font-semibold flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>INSPECT SCHEMA</span>
                </Link>

                <button
                  onClick={() => handleDelete(ds.id, ds.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-[#1E293B] cursor-pointer"
                  title="Delete Dataset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {datasets.length === 0 && (
        <EmptyState
          title="NO DATASETS IN REPOSITORY"
          description="Upload a network capture CSV (CICIDS2017, CSE-CIC-IDS2018, or UNSW-NB15) to begin analysis."
          action={
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase rounded cursor-pointer font-mono"
            >
              Upload Initial Dataset
            </button>
          }
        />
      )}

      {/* Upload Dataset Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="INGEST CSV NETWORK DATASET"
      >
        <form onSubmit={handleUpload} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
              Dataset Alias / Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CICIDS2017_Friday_Imbalanced"
              className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
              Target CSV File
            </label>
            <input
              type="file"
              required
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full bg-[#0F172A] border border-[#24324D] rounded-md p-2 text-xs text-slate-400 file:mr-2.5 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-mono file:bg-[#1E293B] file:text-blue-400 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md text-[11px] text-slate-400 space-y-1">
            <div className="text-blue-400 font-semibold">Accepted Schemas:</div>
            <div>&bull; CICIDS2017 (78 Flow features + 'Label')</div>
            <div>&bull; CSE-CIC-IDS2018 (Flow features + 'Label')</div>
            <div>&bull; UNSW-NB15 (Mapped network flow features)</div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#24324D]">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-3 py-1.5 bg-[#1E293B] text-slate-400 hover:text-slate-100 rounded-md text-xs cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-xs uppercase cursor-pointer"
            >
              {uploading ? 'INGESTING CSV...' : 'CONFIRM INGESTION'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
