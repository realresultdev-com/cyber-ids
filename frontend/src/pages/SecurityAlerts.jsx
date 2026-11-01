import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Trash2,
  RefreshCw,
  Eye,
  Crosshair,
  Server,
  Terminal,
  Activity
} from 'lucide-react';
import { alertsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';

export const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertsAPI.list({
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
      });
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlerts();
  };

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await alertsAPI.updateStatus(alertId, newStatus);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
      if (selectedIncident && selectedIncident.id === alertId) {
        setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update alert triage status.');
    }
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm('Delete this security incident record?')) return;
    try {
      await alertsAPI.delete(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      if (selectedIncident?.id === alertId) {
        setSelectedIncident(null);
      }
    } catch (err) {
      alert('Failed to delete alert.');
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving Security Incident Stream..." />;

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <span>SECURITY INCIDENT TRIAGE & THREAT RESPONSE CENTER</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Active Intrusion Detections from Offline Ingestion and Live Network Sniffing
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="px-3 py-1.5 rounded-md bg-[#1E293B] hover:bg-slate-700 text-slate-200 border border-[#24324D] flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>REFRESH INCIDENTS</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IP, attack vector, or detection model..."
            className="w-full bg-[#0F172A] border border-[#24324D] rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-400 uppercase">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#24324D] rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">ALL SEVERITY</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#24324D] rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">ALL STATUS</option>
              <option value="NEW">NEW</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident Table */}
      <Card
        title="Security Incident Log"
        subtitle="Click any row to open the incident investigation drawer"
        action={
          <div className="text-xs text-slate-400">
            TOTAL: <span className="text-slate-100 font-bold">{alerts.length}</span> ALERTS
          </div>
        }
      >
        <div className="overflow-x-auto border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Incident ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Destination IP</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Attack Category</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Detection Model</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Investigate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/60">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-[#1E293B]/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedIncident(alert)}
                  >
                    <td className="py-2 px-3 text-blue-400 font-semibold">INC-{alert.id}</td>
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-slate-100 font-semibold">
                      {alert.src_ip}:{alert.src_port}
                    </td>
                    <td className="py-2 px-3 text-slate-100">
                      {alert.dst_ip}:{alert.dst_port}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{alert.protocol}</td>
                    <td className="py-2 px-3 font-semibold text-rose-400">
                      {alert.attack_category}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                    </td>
                    <td className="py-2 px-3 text-slate-400 truncate max-w-[130px]">
                      {alert.model_name}
                    </td>
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={alert.status}
                        onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                        className="bg-[#0F172A] border border-[#24324D] rounded px-1.5 py-0.5 text-[10px] text-slate-100 focus:outline-none focus:border-blue-500"
                      >
                        <option value="NEW">NEW</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedIncident(alert)}
                        className="px-2 py-0.5 rounded bg-[#1E293B] hover:bg-slate-700 border border-[#24324D] text-[10px] text-slate-200"
                      >
                        DETAILS
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No security incidents logged matching query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detailed Investigation View / Modal */}
      {selectedIncident && (
        <Modal
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          title={`INCIDENT INVESTIGATION // INC-${selectedIncident.id}`}
        >
          <div className="space-y-4 font-mono text-xs">
            {/* Header info */}
            <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400">DETECTED ATTACK CATEGORY:</span>
                <div className="text-base font-bold text-rose-400">
                  {selectedIncident.attack_category}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">INCIDENT SEVERITY:</span>
                <div>
                  <Badge variant={selectedIncident.severity}>{selectedIncident.severity}</Badge>
                </div>
              </div>
            </div>

            {/* Vector details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md">
                <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                  <span>ATTACKER / SOURCE</span>
                </div>
                <div className="text-sm font-bold text-slate-100">{selectedIncident.src_ip}</div>
                <div className="text-[11px] text-slate-400">Port: {selectedIncident.src_port} &bull; Protocol: {selectedIncident.protocol}</div>
              </div>

              <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md">
                <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VICTIM / DESTINATION</span>
                </div>
                <div className="text-sm font-bold text-slate-100">{selectedIncident.dst_ip}</div>
                <div className="text-[11px] text-slate-400">Target Port: {selectedIncident.dst_port}</div>
              </div>
            </div>

            {/* Telemetry metadata */}
            <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="text-slate-100">{new Date(selectedIncident.timestamp).toUTCString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Detection Model Pipeline:</span>
                <span className="text-blue-400">{selectedIncident.model_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Classification Confidence:</span>
                <span className="text-slate-100 font-bold">{(selectedIncident.confidence * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Triage State:</span>
                <span className="text-amber-400 uppercase font-semibold">{selectedIncident.status}</span>
              </div>
            </div>

            {/* Mitigation recommendation */}
            <div className="p-3 bg-[#1E293B] border border-[#24324D] rounded-md text-[11px] text-slate-300">
              <div className="text-blue-400 font-semibold mb-1">SOC Response Recommendation:</div>
              {selectedIncident.attack_category.includes('DoS') ? (
                <div>Apply IP rate limiting / firewall drop rule for {selectedIncident.src_ip} on port {selectedIncident.dst_port}.</div>
              ) : selectedIncident.attack_category.includes('Patator') ? (
                <div>SSH Brute-force detected. Enforce Fail2ban jail and disable password authentication.</div>
              ) : (
                <div>Isolate host {selectedIncident.dst_ip} and inspect upstream NetFlow logs.</div>
              )}
            </div>

            {/* Footer controls */}
            <div className="flex justify-between items-center pt-2 border-t border-[#24324D]">
              <button
                onClick={() => handleDelete(selectedIncident.id)}
                className="px-2.5 py-1.5 rounded-md bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/60 text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>PURGE INCIDENT</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStatusChange(selectedIncident.id, 'RESOLVED')}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase cursor-pointer transition-colors"
                >
                  MARK RESOLVED
                </button>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-3 py-1.5 rounded-md bg-[#1E293B] text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
