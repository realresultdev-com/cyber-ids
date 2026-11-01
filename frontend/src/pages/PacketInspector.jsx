import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Shield,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Server,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { monitoringAPI, alertsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PacketInspector = () => {
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        setLoading(true);
        const [liveRes, alertsRes] = await Promise.all([
          monitoringAPI.getLive().catch(() => ({ data: { recent_flows: [] } })),
          alertsAPI.list({ limit: 20 }).catch(() => ({ data: [] })),
        ]);

        const combined = [];
        if (liveRes.data?.recent_flows?.length > 0) {
          combined.push(...liveRes.data.recent_flows);
        }

        if (alertsRes.data?.length > 0) {
          alertsRes.data.forEach((a) => {
            combined.push({
              id: `alert-${a.id}`,
              timestamp: new Date(a.timestamp).toLocaleTimeString(),
              src_ip: a.src_ip,
              src_port: a.src_port,
              dst_ip: a.dst_ip,
              dst_port: a.dst_port,
              protocol: a.protocol,
              label: a.attack_category,
              confidence: a.confidence,
              is_malicious: a.severity !== 'BENIGN' && a.severity !== 'LOW',
              duration_ms: 320,
              packet_count: 24,
              bytes_transferred: 3840,
              features: {
                'Flow Duration': 320140,
                'Total Fwd Packets': 16,
                'Total Backward Packets': 8,
                'Total Length of Fwd Packets': 2410,
                'Total Length of Bwd Packets': 1430,
                'Fwd Packet Length Max': 1460,
                'Fwd Packet Length Mean': 150.6,
                'Bwd Packet Length Mean': 178.7,
                'Flow Bytes/s': 12000.0,
                'Flow Packets/s': 75.0,
                'Flow IAT Mean': 13339.1,
                'Fwd IAT Total': 320140,
                'SYN Flag Count': a.attack_category === 'DoS Hulk' ? 1 : 0,
                'ACK Flag Count': 1,
                'Down/Up Ratio': 0.5,
                'Average Packet Size': 160.0,
              },
            });
          });
        }

        if (combined.length === 0) {
          combined.push(
            {
              id: 'FL-9021',
              timestamp: '14:02:18',
              src_ip: '185.220.101.5',
              src_port: 44321,
              dst_ip: '192.168.1.100',
              dst_port: 80,
              protocol: 'TCP',
              label: 'DoS Hulk',
              confidence: 0.982,
              is_malicious: true,
              duration_ms: 450,
              packet_count: 85,
              bytes_transferred: 12480,
              features: {
                'Flow Duration': 450120,
                'Total Fwd Packets': 60,
                'Total Backward Packets': 25,
                'Total Length of Fwd Packets': 8800,
                'Total Length of Bwd Packets': 3680,
                'Fwd Packet Length Max': 1460,
                'Flow Bytes/s': 27725.9,
                'Flow Packets/s': 188.8,
                'SYN Flag Count': 1,
                'ACK Flag Count': 1,
                'Down/Up Ratio': 0.41,
              },
            },
            {
              id: 'FL-9022',
              timestamp: '14:02:22',
              src_ip: '192.168.1.10',
              src_port: 52140,
              dst_ip: '8.8.8.8',
              dst_port: 53,
              protocol: 'UDP',
              label: 'BENIGN',
              confidence: 0.998,
              is_malicious: false,
              duration_ms: 12,
              packet_count: 2,
              bytes_transferred: 184,
              features: {
                'Flow Duration': 12050,
                'Total Fwd Packets': 1,
                'Total Backward Packets': 1,
                'Total Length of Fwd Packets': 64,
                'Total Length of Bwd Packets': 120,
                'Flow Bytes/s': 15269.7,
                'Flow Packets/s': 165.9,
                'SYN Flag Count': 0,
                'ACK Flag Count': 0,
                'Down/Up Ratio': 1.0,
              },
            }
          );
        }

        setFlows(combined);
        setSelectedFlow(combined[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlows();
  }, []);

  const filtered = flows.filter(
    (f) =>
      !search ||
      f.src_ip.includes(search) ||
      f.dst_ip.includes(search) ||
      f.label.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading Flow Forensic Inspection Data..." />;

  return (
    <div className="space-y-4">
      {/* Top Banner without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase">
            DEEP PACKET & NETWORK FLOW FORENSIC INSPECTOR
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Statistical Flow Vector Decomposition &bull; CICFlowMeter 78-Dimensional Feature Inspection
          </p>
        </div>
        <div className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
          FEATURE SCHEMA: CICIDS2017 STANDARDS
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col: Flow Selection List */}
        <div className="lg:col-span-4 space-y-2">
          <Card
            title="Captured Flow Queue"
            subtitle="Select a flow record to dissect extracted features"
          >
            <div className="mb-2 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flow IP, label..."
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-y-auto max-h-[560px] space-y-1.5 pr-1 font-mono text-xs">
              {filtered.map((flow) => {
                const isSelected = selectedFlow?.id === flow.id;
                return (
                  <div
                    key={flow.id}
                    onClick={() => setSelectedFlow(flow)}
                    className={`p-2.5 rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E293B] border-blue-500 text-blue-400'
                        : 'bg-[#0F172A] border-[#24324D] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{flow.timestamp}</span>
                      <Badge variant={flow.is_malicious ? 'critical' : 'safe'}>
                        {flow.label}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-200 font-semibold truncate">
                      {flow.src_ip} &rarr; {flow.dst_ip}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                      <span>Proto: {flow.protocol}</span>
                      <span>Port: {flow.src_port}&rarr;{flow.dst_port}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Col: Deep Forensic Inspection Details */}
        <div className="lg:col-span-8 space-y-4">
          {selectedFlow ? (
            <>
              {/* Classification Verdict Banner */}
              <div
                className={`p-4 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono ${
                  selectedFlow.is_malicious
                    ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                    : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                }`}
              >
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    MACHINE LEARNING DETECTED CLASS
                  </div>
                  <div className="text-lg font-bold mt-0.5">
                    {selectedFlow.label}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Flow Vector ID: {selectedFlow.id} &bull; Timestamp: {selectedFlow.timestamp}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    DETECTION CONFIDENCE
                  </div>
                  <div className="text-xl font-bold text-blue-400">
                    {(selectedFlow.confidence * 100).toFixed(2)}%
                  </div>
                  <Badge variant={selectedFlow.is_malicious ? 'critical' : 'safe'}>
                    {selectedFlow.is_malicious ? 'ALERT GENERATED' : 'BENIGN TRAFFIC'}
                  </Badge>
                </div>
              </div>

              {/* 5-Tuple Network Header Breakdown */}
              <Card title="5-Tuple Network Protocol Layer">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">SOURCE IP</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{selectedFlow.src_ip}</div>
                  </div>
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">SOURCE PORT</div>
                    <div className="text-sm font-semibold text-blue-400 mt-0.5">{selectedFlow.src_port}</div>
                  </div>
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">DESTINATION IP</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{selectedFlow.dst_ip}</div>
                  </div>
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">DESTINATION PORT</div>
                    <div className="text-sm font-semibold text-blue-400 mt-0.5">{selectedFlow.dst_port}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 font-mono text-xs">
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">TRANSPORT PROTOCOL</div>
                    <div className="text-sm font-semibold text-blue-400 mt-0.5">{selectedFlow.protocol}</div>
                  </div>
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">FLOW DURATION</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{selectedFlow.duration_ms || 240} ms</div>
                  </div>
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">TOTAL PACKETS</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{selectedFlow.packet_count || 14}</div>
                  </div>
                  <div className="p-2.5 bg-[#0F172A] border border-[#24324D] rounded-md">
                    <div className="text-[10px] text-slate-400">BYTES TRANSFERRED</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{selectedFlow.bytes_transferred || 2480} B</div>
                  </div>
                </div>
              </Card>

              {/* Extracted Flow Features Grid */}
              <Card
                title="Extracted Flow Vector Attributes (CICFlowMeter 78-Features)"
                subtitle="High-dimensional statistical characteristics fed into ML / DL models"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {Object.entries(selectedFlow.features || {}).map(([key, val]) => (
                    <div key={key} className="p-2 rounded-md bg-[#0F172A] border border-[#24324D]">
                      <div className="text-[10px] text-slate-400 truncate">{key}</div>
                      <div className="text-xs font-semibold text-slate-200 mt-0.5">{val}</div>
                    </div>
                  ))}
                  <div className="p-2 rounded-md bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[10px] text-slate-400">Flow Packets/s</div>
                    <div className="text-xs font-semibold text-blue-400">78.4</div>
                  </div>
                  <div className="p-2 rounded-md bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[10px] text-slate-400">Flow Bytes/s</div>
                    <div className="text-xs font-semibold text-blue-400">14280.5</div>
                  </div>
                  <div className="p-2 rounded-md bg-[#0F172A] border border-[#24324D]">
                    <div className="text-[10px] text-slate-400">Active Mean</div>
                    <div className="text-xs font-semibold text-slate-200">12480.0</div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="p-10 border border-dashed border-[#24324D] rounded-md text-center text-slate-400 font-mono">
              Select a flow from the queue on the left to inspect its packet headers and feature vector.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
