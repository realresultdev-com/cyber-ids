import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, Lock, User, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-blue-600/30 selection:text-blue-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-blue-600 text-white mb-3 shadow-md">
          <Shield className="w-5 h-5" />
        </div>
        <h1 className="text-sm font-mono font-bold tracking-widest text-slate-100 uppercase">
          NETGUARD // SOC CONSOLE
        </h1>
        <p className="mt-1 text-xs font-mono text-slate-400">
          Intrusion Detection of Imbalanced Network Traffic [ML & DL]
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#131D31] py-6 px-6 sm:px-8 border border-[#24324D] rounded-md shadow-2xl">
          <div className="mb-5 pb-3 border-b border-[#24324D] flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>TERMINAL AUTHENTICATION</span>
            </span>
            <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 text-[10px]">
              ONLINE
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded flex items-start space-x-2.5 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-5">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase tracking-wider">
                Operator Principal
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter operator username"
                  className="w-full bg-[#0F172A] border border-[#24324D] rounded-md pl-9 pr-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase tracking-wider">
                Access Token / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter credential password"
                  className="w-full bg-[#0F172A] border border-[#24324D] rounded-md pl-9 pr-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-semibold text-xs uppercase tracking-wider py-2.5 rounded-md transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'AUTHENTICATING TOKEN...' : 'INITIALIZE SOC SESSION'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-[#24324D]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Operator Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="px-2.5 py-1.5 rounded-md bg-[#1E293B] hover:bg-slate-700 border border-[#24324D] text-[11px] font-mono text-blue-400 font-medium transition-colors text-center cursor-pointer"
              >
                Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('analyst', 'analyst123')}
                className="px-2.5 py-1.5 rounded-md bg-[#1E293B] hover:bg-slate-700 border border-[#24324D] text-[11px] font-mono text-slate-200 font-medium transition-colors text-center cursor-pointer"
              >
                Analyst (Read-Only)
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] font-mono text-slate-500">
          RESTRICTED CYBERSECURITY SYSTEM &bull; AUTHORIZED SOC ACCESS ONLY
        </p>
      </div>
    </div>
  );
};
