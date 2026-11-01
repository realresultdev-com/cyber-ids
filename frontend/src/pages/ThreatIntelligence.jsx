import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Crosshair,
  Server,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Shield
} from 'lucide-react';
import { alertsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ThreatIntelligence = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const res = await alertsAPI.list({ limit: 50 });
        setAlerts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return <LoadingSpinner text="Connecting to Threat Intelligence Feeds..." />;

  // Threat Actor / Signature taxonomy mapped to MITRE ATT&CK
  const threatFeeds = [
    {
      actor: 'APT-Hulk Flooder',
      ip: '185.220.101.5',
      mitre: 'T1498.001 - Direct Network Flooding',
      category: 'DoS Hulk',
      confidence: '98.2%',
      severity: 'CRITICAL',
      status: 'BLOCKED',
      rule: 'iptables -A INPUT -s 185.220.101.5 -j DROP',
    },
    {
      actor: 'Mirai Variant / Botnet',
      ip: '103.251.167.20',
      mitre: 'T1498 - Denial of Service',
      category: 'DDoS',
      confidence: '99.5%',
      severity: 'CRITICAL',
      status: 'BLOCKED',
      rule: 'iptables -A INPUT -s 103.251.167.20 -j DROP',
    },
    {
      actor: 'Patator SSH Scanner',
      ip: '198.51.100.42',
      mitre: 'T1110.001 - Password Guessing',
      category: 'SSH-Patator',
      confidence: '94.1%',
      severity: 'HIGH',
      status: 'RATE_LIMITED',
      rule: 'fail2ban-client set sshd banip 198.51.100.42',
    },
    {
      actor: 'SYN Sweep Recon',
      ip: '45.142.182.11',
      mitre: 'T1046 - Network Service Discovery',
      category: 'PortScan',
      confidence: '92.6%',
      severity: 'MEDIUM',
      status: 'MONITORED',
      rule: 'iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST SYN -m limit --limit 1/s -j ACCEPT',
    },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <span>THREAT INTELLIGENCE & MITRE ATT&CK MAPPING</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Adversary TTP Signatures &bull; Known Ingress IP Reputation &bull; Firewall Containment Rules
          </p>
        </div>
        <div className="text-[10px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/60">
          FEED STATUS: LIVE SYNCED
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          title="Known Attackers"
          value="4 Host IPs"
          subtitle="Identified Threat Actors"
          icon={Crosshair}
          variant="threat"
        />
        <MetricCard
          title="MITRE Techniques"
          value="3 Active TTPs"
          subtitle="Network Denial & Credential"
          icon={Shield}
          variant="info"
        />
        <MetricCard
          title="Firewall Drops"
          value="2 Enforced"
          subtitle="Automated Containment"
          icon={Lock}
          variant="normal"
        />
        <MetricCard
          title="Average Confidence"
          value="96.1%"
          subtitle="Model Consensus Score"
          icon={Activity}
          variant="default"
        />
      </div>

      {/* Threat Feeds Table */}
      <Card
        title="Active Adversary Signatures & IOC Repository"
        subtitle="Identified ingress attack vectors mapped against MITRE ATT&CK enterprise matrix"
      >
        <div className="overflow-x-auto border border-[#24324D] rounded-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-[#24324D] text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Adversary Profile</th>
                <th className="py-2.5 px-3">Ingress IP</th>
                <th className="py-2.5 px-3">Attack Category</th>
                <th className="py-2.5 px-3">MITRE ATT&CK ID</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Containment Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24324D]/60">
              {threatFeeds.map((feed) => (
                <tr key={feed.ip} className="hover:bg-[#1E293B]/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-100">{feed.actor}</td>
                  <td className="py-2 px-3 text-rose-400 font-semibold">{feed.ip}</td>
                  <td className="py-2 px-3 text-blue-400 font-medium">{feed.category}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{feed.mitre}</td>
                  <td className="py-2 px-3 text-slate-100 font-bold">{feed.confidence}</td>
                  <td className="py-2 px-3">
                    <Badge variant={feed.severity}>{feed.severity}</Badge>
                  </td>
                  <td className="py-2 px-3">
                    <code className="text-[10px] bg-[#0F172A] text-slate-200 px-2 py-0.5 rounded border border-[#24324D] block truncate max-w-[220px]">
                      {feed.rule}
                    </code>
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

