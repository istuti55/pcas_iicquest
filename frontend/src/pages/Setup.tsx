import * as React from 'react';
import { useState } from 'react';
import { organizationAPI, queueAPI } from '../services/api';
import { Building2, ListOrdered, ChevronRight, ArrowLeft, Sparkles, Layout } from 'lucide-react';

interface SetupProps {
  onSetupComplete: (orgId: string, queueId: string) => void;
}

export default function Setup({ onSetupComplete }: SetupProps) {
  const [step, setStep] = useState<'org' | 'queue'>('org');
  const [orgName, setOrgName] = useState('');
  const [queueName, setQueueName] = useState('');
  const [queueDesc, setQueueDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orgId, setOrgId] = useState('');

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await organizationAPI.create(orgName);
      setOrgId(res.data.id);
      setStep('queue');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize organization.');
    } finally { setLoading(false); }
  };

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await queueAPI.create(orgId, { name: queueName, description: queueDesc });
      onSetupComplete(orgId, res.data.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create queue.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen text-slate-100 flex selection:bg-blue-500/30">
      <div className="w-full max-w-xl relative z-10 animate-in mx-auto flex flex-col justify-center">
        {/* Logo/Branding */}
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6 bg-white/5 px-5 py-2 rounded-2xl border border-white/5 animate-in" style={{ animationDelay: '0.1s' }}>
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Environment Initialization</span>
            </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tighter">Welcome to Pālo.</h1>
          <p className="text-slate-500 font-medium tracking-wide">Let's configure your queue management system.</p>
        </div>

        {/* Steps Bar */}
        <div className="flex gap-4 mb-10 px-2 animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div className={`absolute inset-0 bg-blue-600 transition-transform duration-700 ${step === 'org' ? 'translate-x-0' : 'translate-x-0'}`} />
          </div>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div className={`absolute inset-0 bg-blue-600 transition-transform duration-700 ${step === 'queue' ? 'translate-x-0' : '-translate-x-full'}`} />
          </div>
        </div>

        <div className="premium-card p-10 md:p-14 animate-in shadow-blue-900/10" style={{ animationDelay: '0.3s' }}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl px-6 py-4 mb-8 text-sm font-medium">
              {error}
            </div>
          )}

          {step === 'org' ? (
            <form onSubmit={handleCreateOrg} className="space-y-10">
              <div className="flex flex-col items-center gap-6">
                 <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-xl">
                   <Building2 size={36} className="text-blue-400" />
                 </div>
                 <div className="text-center">
                   <h2 className="text-2xl font-black text-white mb-2">Organization Setup</h2>
                   <p className="text-slate-500 text-sm font-medium">Enter your business or facility name</p>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Official Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g., City Medical Center"
                  className="w-full h-16 bg-slate-900/50 border border-white/5 focus:border-blue-500/50 rounded-2xl px-6 text-white text-lg transition-all focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !orgName}
                className="w-full h-16 btn-primary disabled:opacity-50 tracking-widest text-sm uppercase gap-3 group"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Continue <ArrowLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateQueue} className="space-y-8">
              <div className="flex items-center gap-5">
                <button type="button" onClick={() => setStep('org')} className="p-3 bg-white/5 text-slate-500 hover:text-white rounded-2xl border border-white/5 transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                   <h2 className="text-xl font-black text-white mb-1">Queue Configuration</h2>
                   <p className="text-slate-500 text-xs font-medium">Define your first service counter</p>
                </div>
                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                   <Layout size={24} className="text-indigo-400" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Queue Identity</label>
                  <input
                    type="text"
                    required
                    value={queueName}
                    onChange={e => setQueueName(e.target.value)}
                    placeholder="e.g., Main Reception"
                    className="w-full h-16 bg-slate-900/50 border border-white/5 focus:border-blue-500/50 rounded-2xl px-6 text-white text-lg transition-all focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Description (Optional)</label>
                  <textarea
                    value={queueDesc}
                    onChange={e => setQueueDesc(e.target.value)}
                    placeholder="Short purpose of this queue..."
                    rows={3}
                    className="w-full bg-slate-900/50 border border-white/5 focus:border-blue-500/50 rounded-2xl p-6 text-white text-lg transition-all focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-700 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !queueName}
                className="w-full h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black tracking-widest text-sm uppercase rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-[0.98] mt-4"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : 'Finalize & Launch'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
