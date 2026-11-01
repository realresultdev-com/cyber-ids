import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2, Shield, Bell, Radio, Terminal, Cpu } from 'lucide-react';
import { settingsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsAPI.get();
        setSettings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await settingsAPI.update(settings);
      setSettings(res.data);
      setSavedMsg('Engine telemetry parameters committed to system config.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <LoadingSpinner text="Querying SOC Engine Parameters..." />;

  return (
    <div className="space-y-4 max-w-4xl font-mono">
      {/* Top Banner */}
      <div className="bg-[#131D31] border border-[#24324D] rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <span>SYSTEM ENGINE ARCHITECTURE CONFIGURATION</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Detection Sensitivity &bull; Flow Buffer Size &bull; Auto-Triage Policies &bull; Windows Adapter Parameters
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-md text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <Card title="Detection Engine Sensitivity" subtitle="Calibrate classification threshold and alert triggering">
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span className="uppercase">Anomaly Confidence Cutoff</span>
                <span className="text-slate-100 font-bold">{(parseFloat(settings.anomaly_threshold || '0.75') * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={settings.anomaly_threshold || '0.75'}
                onChange={(e) => handleChange('anomaly_threshold', e.target.value)}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Flows with predicted threat probability exceeding this value trigger alert escalation.
              </p>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Minimum Alert Trigger Severity
              </label>
              <select
                value={settings.alert_severity_threshold || 'MEDIUM'}
                onChange={(e) => handleChange('alert_severity_threshold', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">LOW (Log all anomalies including port sweeps)</option>
                <option value="MEDIUM">MEDIUM (Filter suspicious sweeps, log attacks)</option>
                <option value="HIGH">HIGH (DoS & Critical only)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card title="Network Flow Aggregation & Sniffer Policies" subtitle="Configure packet buffers and flow timeouts">
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Flow Inactivity Timeout (Seconds)
              </label>
              <input
                type="number"
                value={settings.flow_timeout_seconds || '15'}
                onChange={(e) => handleChange('flow_timeout_seconds', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Time without packets before a 5-tuple flow is finalized and evaluated by ML pipeline.
              </p>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                Real-Time Memory Buffer Limit (Flows)
              </label>
              <input
                type="number"
                value={settings.max_live_flows || '500'}
                onChange={(e) => handleChange('max_live_flows', e.target.value)}
                className="w-full bg-[#0F172A] border border-[#24324D] rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'COMMITTING CONFIG...' : 'COMMIT SYSTEM SETTINGS'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
