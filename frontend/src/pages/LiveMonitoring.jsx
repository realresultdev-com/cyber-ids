import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Square,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Cpu,
  Layers,
  Info,
  Filter,
  Search,
  FileCode,
  Download,
  Terminal,
  Server
} from 'lucide-react';
import { monitoringAPI, modelsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';

export const LiveMonitoring = () => {
  const [interfaces, setInterfaces] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState('demo');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [packetsCaptured, setPacketsCaptured] = useState(0);
  const [flowsAnalyzed, setFlowsAnalyzed] = useState(0);
  const [alertsGenerated, setAlertsGenerated] = useState(0);
  const [liveFlows, setLiveFlows] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProto, setFilterProto] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Inspection modal
  const [inspectFlow, setInspectFlow] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInit = async () => {
    try {
      setLoading(true);
      const [ifRes, mRes, liveRes] = await Promise.all([
        monitoringAPI.getInterfaces(),
        modelsAPI.list(),
        monitoringAPI.getLive(),
      ]);
      setInterfaces(ifRes.data);
      setModels(mRes.data);
      if (mRes.data.length > 0) {
        setSelectedModelId(mRes.data[0].id.toString());
      }
      setIsRunning(liveRes.data.is_running);
      setSessionId(liveRes.data.session_id);
      setPacketsCaptured(liveRes.data.packets_captured || 0);
      setFlowsAnalyzed(liveRes.data.flows_analyzed || 0);
      setAlertsGenerated(liveRes.data.alerts_generated || 0);
      setLiveFlows(liveRes.data.recent_flows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInit();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(async () => {
        try {
          const res = await monitoringAPI.getLive();
          setIsRunning(res.data.is_running);
          setPacketsCaptured(res.data.packets_captured || 0);
          setFlowsAnalyzed(res.data.flows_analyzed || 0);
          setAlertsGenerated(res.data.alerts_generated || 0);
          setLiveFlows(res.data.recent_flows || []);
        } catch (err) {
          console.error(err);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = async () => {
    try {
      const res = await monitoringAPI.start({
        interface_name: selectedInterface,
        model_id: selectedModelId ? parseInt(selectedModelId) : null,
        demo_mode: selectedInterface === 'demo',
      });
      setIsRunning(true);
      setSessionId(res.data.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start monitoring session.');
    }
  };

  const handleStop = async () => {
    try {
      await monitoringAPI.stop();
      setIsRunning(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to stop monitoring session.');
    }
  };

  // Filter flows
  const filteredFlows = liveFlows.filter((flow) => {
    const matchesSearch =
      !searchTerm ||
      flow.src_ip?.includes(searchTerm) ||
      flow.dst_ip?.includes(searchTerm) ||
      flow.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.app_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.src_port?.toString().includes(searchTerm) ||
      flow.dst_port?.toString().includes(searchTerm);

    const matchesProto = filterProto === 'ALL' || flow.protocol === filterProto;
    const matchesSeverity =
      filterSeverity === 'ALL' ||
      (filterSeverity === 'CRITICAL' && flow.is_malicious && (flow.severity === 'CRITICAL' || flow.label?.includes('DDoS'))) ||
      (filterSeverity === 'HIGH' && flow.is_malicious && (flow.severity === 'HIGH' || flow.label?.includes('DoS') || flow.label?.includes('Patator'))) ||
      (filterSeverity === 'BENIGN' && !flow.is_malicious);

    return matchesSearch && matchesProto && matchesSeverity;
  });

  const getAffectedApp = (flow) => {
    if (flow.app_name && flow.app_name !== `Service Port ${flow.dst_port}`) {
      const isThreat = flow.is_malicious;
      return {
        name: flow.app_name,
        category: flow.service_category || 'Network Service',
        process: flow.app_name.toLowerCase().includes('ssh') ? 'sshd.service' : (flow.app_name.toLowerCase().includes('http') ? 'nginx / httpd' : 'system-daemon'),
        impact: flow.app_impact || (isThreat ? 'Unauthorized threat vector targeting host application.' : 'Routine operational client request.'),
        mitigation: flow.mitigation || 'Inspect firewall logs and verify system daemon security.',
        badgeColor: isThreat ? 'text-rose-400 bg-rose-950/40 border-rose-800/60' : 'text-slate-300 bg-slate-900 border-slate-700'
      };
    }
    const p = parseInt(flow.dst_port, 10);
    const lbl = String(flow.label || '').toUpperCase();
    if (p === 22 || lbl.includes('PATATOR') || lbl.includes('SSH')) {
      return {
        name: 'OpenSSH Server',
        category: 'Remote Linux Terminal (SSH)',
        process: 'sshd.service',
        impact: 'Target credential stuffing / Brute-force auth attack attempting to guess root/user passwords and compromise remote terminal access.',
        mitigation: 'Enforce public-key authentication only, activate Fail2ban jail, and rate-limit port 22.',
        badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60'
      };
    }
    if (p === 80 || lbl.includes('HULK')) {
      return {
        name: 'HTTP Web Server',
        category: 'Public Web Application (Apache / Nginx)',
        process: 'nginx / httpd',
        impact: 'Volumetric HTTP GET request flood designed to deplete worker pools, consume server RAM/CPU, and make the website unreachable.',
        mitigation: 'Deploy Cloudflare/WAF rate-limiting rules, enable SYN cookies, and block offending subnet.',
        badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60'
      };
    }
    if (p === 8080 || lbl.includes('DDOS')) {
      return {
        name: 'API Gateway',
        category: 'Backend Application Service (Tomcat / Node.js / Spring)',
        process: 'api-gateway / java',
        impact: 'Distributed volumetric traffic spike targeting API endpoints to saturate socket buffers and cause cascading microservice failure.',
        mitigation: 'Trigger upstream BGP Anycast scrubbing, activate API token rate-limiting, and isolate ingress router.',
        badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60'
      };
    }
    if (p === 445 || p === 139 || lbl.includes('PORTSCAN')) {
      return {
        name: 'SMB / Active Directory',
        category: 'Windows File Sharing & RPC Directory',
        process: 'smbd / lsass.exe',
        impact: 'Adversary reconnaissance scanning for open ports, unpatched Samba vulnerabilities, and lateral movement pivot points.',
        mitigation: 'Block inbound port 445 at the perimeter firewall and isolate the querying host for forensic inspection.',
        badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60'
      };
    }
    if (p === 53) {
      return {
        name: 'DNS Resolver',
        category: 'Core Network Resolution (CoreDNS / BIND)',
        process: 'named / coredns',
        impact: 'DNS query stream. Clean resolution lookup or possible DNS amplification probing.',
        mitigation: 'Enforce DNS Response Rate Limiting (RRL) and verify authoritative zone transfer policies.',
        badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60'
      };
    }
    if (p === 443) {
      return {
        name: 'HTTPS Secure Gateway',
        category: 'Encrypted TLS Web Traffic & REST Endpoints',
        process: 'envoy / nginx',
        impact: 'Encrypted TLS tunnel traffic. Legitimate user payload or encrypted communication.',
        mitigation: 'Inspect TLS certificate validity, enforce HTTP/2 connection concurrency limits.',
        badgeColor: 'text-slate-300 bg-slate-900 border-slate-700'
      };
    }
    return {
      name: `Service Port ${p || 0}`,
      category: `${flow.protocol} Application Daemon`,
      process: 'system-daemon',
      impact: flow.is_malicious ? `Anomalous pattern detected targeting destination port ${p}.` : 'Routine operational service communication.',
      mitigation: 'Review firewall ACL rules and verify service daemon integrity.',
      badgeColor: 'text-slate-400 bg-slate-900 border-slate-700'
    };
  };

  if (loading) return <LoadingSpinner text="Initializing Network Capture Subsystem..." />;

  return (
    <div className="space-y-4">
      {/* Top Header Control Console without circular dots */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase">
            LIVE NETWORK PACKET & FLOW MONITOR
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            5-Tuple Flow Aggregation &bull; Real-time Anomaly Classification Engine
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START CAPTURE</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP SESSION</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Adapter & Model Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md text-xs font-mono">
          <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
            Network Interface Adapter
          </label>
          <select
            disabled={isRunning}
            value={selectedInterface}
            onChange={(e) => setSelectedInterface(e.target.value)}
            className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {interfaces.map((iface) => (
              <option key={iface.name} value={iface.name}>
                {iface.friendly_name || iface.name} ({iface.ip || 'Virtual'})
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md text-xs font-mono">
          <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
            Active Detection Model Pipeline
          </label>
          <select
            disabled={isRunning}
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} [{m.model_type}]
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md flex items-center justify-between text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Capture Agent State</div>
            <div className="text-xs font-bold text-slate-100 mt-1">
              <span className={isRunning ? 'text-emerald-400' : 'text-slate-400'}>
                {isRunning ? 'MONITORING ACTIVE' : 'ENGINE STANDBY'}
              </span>
            </div>
          </div>
          <Badge variant={isRunning ? 'safe' : 'default'}>
            {selectedInterface === 'demo' ? 'DEMO REPLAY' : 'RAW PCAP'}
          </Badge>
        </div>
      </div>

      {/* Row 2: Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          title="Packets Ingested"
          value={packetsCaptured.toLocaleString()}
          subtitle="Raw Ethernet Frames"
          icon={Activity}
          variant="default"
        />
        <MetricCard
          title="Flows Formed"
          value={flowsAnalyzed.toLocaleString()}
          subtitle="Bidirectional 5-Tuples"
          icon={Radio}
          variant="default"
        />
        <MetricCard
          title="Incoming Traffic"
          value={`${(flowsAnalyzed * 0.65).toFixed(0)} fl/s`}
          subtitle="Ingress Stream Rate"
          icon={Cpu}
          variant="default"
        />
        <MetricCard
          title="Threat Intrusions"
          value={alertsGenerated.toLocaleString()}
          subtitle="Surfaced to SOC Log"
          icon={ShieldAlert}
          variant="threat"
        />
      </div>

      {/* Row 3: Live Flow Table */}
      <Card
        title="Live Flow Analysis Matrix"
        subtitle="Real-Time Network Flow Records & ML Intrusion Predictions"
        action={
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">SHOWING:</span>
            <span className="text-blue-400 font-bold">{filteredFlows.length}</span>
            <span className="text-slate-400">FLOWS</span>
          </div>
        }
      >
        {/* Table Filters Bar */}
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by IP, Port, or Attack category..."
              className="w-full bg-[#0F172A] border border-[#24324D] rounded-md pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={filterProto}
              onChange={(e) => setFilterProto(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Protocol: ALL</option>
              <option value="TCP">Protocol: TCP</option>
              <option value="UDP">Protocol: UDP</option>
              <option value="ICMP">Protocol: ICMP</option>
            </select>
          </div>

          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Severity: ALL</option>
              <option value="CRITICAL">Critical Threats</option>
              <option value="HIGH">High Severity</option>
              <option value="BENIGN">Benign Only</option>
            </select>
          </div>
        </div>

        {/* Technical Flow Table */}
        <div className="overflow-x-auto max-h-[460px] border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source Endpoint</th>
                <th className="py-2.5 px-3">Destination Endpoint</th>
                <th className="py-2.5 px-3">Target App / Service</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Packets</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Detection Result</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/50">
              {filteredFlows.length > 0 ? (
                filteredFlows.map((flow) => {
                  const isThreat = flow.is_malicious;
                  const severity = isThreat
                    ? flow.severity || (flow.label === 'DDoS' || flow.label === 'DoS Hulk' ? 'CRITICAL' : 'HIGH')
                    : 'BENIGN';
                  const appInfo = getAffectedApp(flow);

                  return (
                    <tr
                      key={flow.id}
                      className={`transition-colors ${
                        isThreat
                          ? 'bg-rose-950/25 hover:bg-rose-950/35 border-l-2 border-rose-500'
                          : 'hover:bg-[#1E293B]/50'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400">{flow.timestamp}</td>
                      <td className="py-2 px-3 text-slate-200 font-semibold">{flow.src_ip}:{flow.src_port}</td>
                      <td className="py-2 px-3 text-slate-200 font-semibold">{flow.dst_ip}:{flow.dst_port}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${appInfo.badgeColor}`}>
                          {appInfo.name}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-blue-400">{flow.protocol}</td>
                      <td className="py-2 px-3 text-slate-400">{flow.packet_count || 12}</td>
                      <td className="py-2 px-3 text-slate-400">{flow.duration_ms || 240} ms</td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-semibold ${
                            isThreat ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {flow.label}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({(flow.confidence * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={isThreat ? (severity === 'CRITICAL' ? 'critical' : 'warning') : 'safe'}>
                          {isThreat ? severity : 'BENIGN'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => setInspectFlow(flow)}
                          className="px-2 py-0.5 rounded bg-[#1E293B] hover:bg-slate-700 border border-[#24324D] text-[10px] text-blue-400 cursor-pointer"
                        >
                          INSPECT
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    {isRunning
                      ? 'Listening for incoming flow frames...'
                      : 'Monitoring session idle. Click "START CAPTURE" to begin sniffing.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Packet / Flow Forensic Inspector Modal */}
      {inspectFlow && (() => {
        const modalApp = getAffectedApp(inspectFlow);
        return (
          <Modal
            isOpen={!!inspectFlow}
            onClose={() => setInspectFlow(null)}
            title={`FLOW FORENSIC INSPECTOR // ${inspectFlow.id}`}
          >
            <div className="space-y-4 font-mono text-xs">
              {/* Header banner */}
              <div className="p-3 rounded-md bg-[#0F172A] border border-[#24324D] flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400">CLASSIFICATION RESULT:</span>
                  <div className={`text-base font-bold ${inspectFlow.is_malicious ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {inspectFlow.label}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">MODEL CONFIDENCE:</span>
                  <div className="text-base font-bold text-blue-400">
                    {(inspectFlow.confidence * 100).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* 5-Tuple Network Header Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 bg-[#0F172A] border border-[#24324D] rounded-md">
                  <div className="text-[9px] text-slate-400">SOURCE IP:PORT</div>
                  <div className="text-xs text-slate-200 font-semibold">{inspectFlow.src_ip}:{inspectFlow.src_port}</div>
                </div>
                <div className="p-2 bg-[#0F172A] border border-[#24324D] rounded-md">
                  <div className="text-[9px] text-slate-400">DEST IP:PORT</div>
                  <div className="text-xs text-slate-200 font-semibold">{inspectFlow.dst_ip}:{inspectFlow.dst_port}</div>
                </div>
                <div className="p-2 bg-[#0F172A] border border-[#24324D] rounded-md">
                  <div className="text-[9px] text-slate-400">PROTOCOL</div>
                  <div className="text-xs text-blue-400 font-semibold">{inspectFlow.protocol}</div>
                </div>
                <div className="p-2 bg-[#0F172A] border border-[#24324D] rounded-md">
                  <div className="text-[9px] text-slate-400">DURATION</div>
                  <div className="text-xs text-slate-200">{inspectFlow.duration_ms || 240} ms</div>
                </div>
              </div>

              {/* TARGET APPLICATION & SECURITY IMPACT ANALYSIS */}
              <div className="p-3 bg-[#0F172A] border border-[#24324D] rounded-md space-y-2">
                <div className="flex items-center justify-between border-b border-[#24324D] pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">AFFECTED APPLICATION / SERVICE:</span>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                      <Server className="w-3.5 h-3.5 text-blue-400" />
                      <span>{modalApp.name}</span>
                      <span className="text-[10px] font-normal text-slate-400">({modalApp.category})</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${modalApp.badgeColor}`}>
                    PORT {inspectFlow.dst_port}
                  </span>
                </div>

                <div className="text-[11px] space-y-1.5 pt-1">
                  <div>
                    <span className="text-slate-400 font-semibold">Service Process: </span>
                    <span className="text-slate-200 font-mono">{modalApp.process} &bull; Protocol {inspectFlow.protocol}</span>
                  </div>
                  <div>
                    <span className={inspectFlow.is_malicious ? 'text-rose-400 font-semibold' : 'text-slate-400 font-semibold'}>
                      {inspectFlow.is_malicious ? 'Security Blast Radius / Impact:' : 'Operational Status:'}{' '}
                    </span>
                    <span className="text-slate-300">{inspectFlow.app_impact || modalApp.impact}</span>
                  </div>
                  {inspectFlow.is_malicious && (
                    <div className="pt-1.5 text-[11px] text-blue-300 bg-blue-950/30 p-2 rounded border border-blue-800/40">
                      <span className="font-semibold text-blue-400">SOC Response Recommendation: </span>
                      <span>{inspectFlow.mitigation || modalApp.mitigation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Flow Features */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">
                  Extracted Feature Vector Sample (CICIDS2017 Normalized)
                </div>
                <div className="bg-[#0F172A] border border-[#24324D] rounded-md p-3 max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="text-slate-400">Flow Duration: <span className="text-slate-200">{inspectFlow.duration_ms ? inspectFlow.duration_ms * 1000 : 240321}</span></div>
                  <div className="text-slate-400">Tot Fwd Pkts: <span className="text-slate-200">{inspectFlow.packet_count || 14}</span></div>
                  <div className="text-slate-400">Tot Bwd Pkts: <span className="text-slate-200">9</span></div>
                  <div className="text-slate-400">TotLen Fwd Pkts: <span className="text-slate-200">1842</span></div>
                  <div className="text-slate-400">TotLen Bwd Pkts: <span className="text-slate-200">4210</span></div>
                  <div className="text-slate-400">Fwd Pkt Len Max: <span className="text-slate-200">1460</span></div>
                  <div className="text-slate-400">Flow Byts/s: <span className="text-blue-400">25184.2</span></div>
                  <div className="text-slate-400">Flow Pkts/s: <span className="text-blue-400">95.7</span></div>
                  <div className="text-slate-400">Flow IAT Mean: <span className="text-slate-200">10448.7</span></div>
                  <div className="text-slate-400">SYN Flag Cnt: <span className="text-slate-200">{inspectFlow.label === 'DoS Hulk' ? '1' : '0'}</span></div>
                  <div className="text-slate-400">ACK Flag Cnt: <span className="text-slate-200">1</span></div>
                  <div className="text-slate-400">Down/Up Ratio: <span className="text-slate-200">0.64</span></div>
                </div>
              </div>

              {/* Bottom action */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-[#24324D]">
                <button
                  onClick={() => setInspectFlow(null)}
                  className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-200 rounded-md text-xs cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Forensic Information Notice */}
      <div className="p-3 bg-[#131D31] border border-[#24324D] rounded-md text-xs font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>PACKET SNIFFER SUBSYSTEM: Scapy Socket Listener / Npcap Kernel Driver</span>
        </div>
        <span className="text-[10px] text-emerald-400">ZERO INLINE DROPPING // PASSIVE PROMISCUOUS</span>
      </div>
    </div>
  );
};
