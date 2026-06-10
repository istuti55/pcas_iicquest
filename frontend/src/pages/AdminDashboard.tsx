import { useState, useEffect } from 'react';
import { queueAPI, tokenAPI, adminAPI, mlAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import TokenBadge from '../components/TokenBadge';
import {
  Users, Clock, Monitor,
  ChevronRight, LogOut, Phone,
  ArrowRight, ShieldCheck, Activity, KeyRound, Brain, CheckCircle2, Settings
} from 'lucide-react';

interface AdminDashboardProps {
  queueId: string;
  orgId: string;
  onLogout: () => void;
  onQueueChange: (qId: string) => void;
}

export default function AdminDashboard({ queueId, orgId, onLogout, onQueueChange }: AdminDashboardProps) {
  const [queueName, setQueueName] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [opData, setOpData] = useState<any>(null);
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [allQueues, setAllQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<number>(0);
  const [localDailyLimit, setLocalDailyLimit] = useState<string>('');
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [serviceDate, setServiceDate] = useState<'today' | 'tomorrow'>('today');
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'display' | 'configuration' | 'security'>('overview');

  // Configuration state
  const [configName, setConfigName] = useState('');
  const [configDesc, setConfigDesc] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create queue state
  const [newQueueName, setNewQueueName] = useState('');
  const [newQueueDesc, setNewQueueDesc] = useState('');
  const [createQueueLoading, setCreateQueueLoading] = useState(false);
  const [createQueueMsg, setCreateQueueMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change password state
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ML seeding
  const [mlSeeding, setMlSeeding] = useState(false);
  const [mlMsg, setMlMsg] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [qRes, sRes, opRes, mlRes, listRes] = await Promise.all([
        queueAPI.get(queueId),
        queueAPI.getStats(queueId, serviceDate),
        queueAPI.getOperatorView(queueId, serviceDate),
        queueAPI.predict(queueId).catch(() => ({ data: null })),
        queueAPI.list(orgId),
      ]);
      setQueueName(qRes.data.name);
      
      // Initialize config fields only if not currently typing in them
      if (document.activeElement?.id !== 'configNameInput' && document.activeElement?.id !== 'configDescInput') {
        setConfigName(qRes.data.name || '');
        setConfigDesc(qRes.data.description || '');
      }

      setDailyLimit(qRes.data.daily_limit || 0);
      if (document.activeElement?.id !== 'dailyLimitInput') {
        setLocalDailyLimit((qRes.data.daily_limit || 0).toString());
      }
      setStats(sRes.data);
      setOpData(opRes.data);
      setAllQueues(listRes.data);
      if (mlRes.data) setMlPrediction(mlRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => clearInterval(t);
  }, [queueId, serviceDate]);

  const handleCallNext = async () => {
    if (!opData?.next_token) return;
    setCalling(true);
    try {
      await tokenAPI.updateState(opData.next_token.id, 'called');
      await tokenAPI.updateState(opData.next_token.id, 'serving');
      await fetchAll();
    } catch {}
    setCalling(false);
  };

  const handleComplete = async (id: string) => {
    try { await tokenAPI.updateState(id, 'completed'); await fetchAll(); } catch {}
  };

  const handleSkip = async (id: string) => {
    try { await tokenAPI.updateState(id, 'no_show'); await fetchAll(); } catch {}
  };

  const updateDailyLimit = async () => {
    setIsUpdatingLimit(true);
    try {
      const newLimit = parseInt(localDailyLimit) || 0;
      await queueAPI.update(queueId, { daily_limit: newLimit });
      setDailyLimit(newLimit);
      await fetchAll();
    } catch {}
    setIsUpdatingLimit(false);
  };

  const handleUpdateConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true); setConfigMsg(null);
    try {
      await queueAPI.update(queueId, { name: configName, description: configDesc });
      setConfigMsg({ type: 'success', text: 'Queue configuration updated successfully.' });
      await fetchAll();
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update configuration.' });
    }
    setConfigLoading(false);
  };

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateQueueLoading(true); setCreateQueueMsg(null);
    try {
      const res = await queueAPI.create(orgId, { name: newQueueName, description: newQueueDesc });
      setCreateQueueMsg({ type: 'success', text: `Successfully created queue: ${res.data.name}` });
      setNewQueueName(''); setNewQueueDesc('');
      await fetchAll();
      // Optional: switch to it immediately
      // onQueueChange(res.data.id);
    } catch (err: any) {
      setCreateQueueMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to create queue.' });
    }
    setCreateQueueLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) { setPwMsg({ type: 'error', text: 'New PINs do not match.' }); return; }
    if (pwNew.length < 4) { setPwMsg({ type: 'error', text: 'New PIN must be at least 4 digits.' }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      await adminAPI.changePassword(pwCurrent, pwNew);
      setPwMsg({ type: 'success', text: 'PIN updated successfully! Use the new PIN on next login.' });
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update PIN.' });
    }
    setPwLoading(false);
  };

  const handleSeedML = async () => {
    setMlSeeding(true); setMlMsg(null);
    try {
      const res = await mlAPI.seedData();
      setMlMsg(`Model ready: ${res.data.status}. ${res.data.records_added ?? 0} records added.`);
    } catch (err: any) {
      setMlMsg(err.response?.data?.detail || 'Seeding failed.');
    }
    setMlSeeding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const navBtn = (tab: typeof activeTab, label: string, Icon: any, extra?: () => void) => (
    <button
      onClick={() => { setActiveTab(tab); extra?.(); }}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
        activeTab === tab ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen text-slate-100 flex selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-80 flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl p-10 sticky top-0 h-screen">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all rounded-full" />
            <ShieldCheck size={28} className="text-blue-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">Pālo Console</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Command Center</p>
          </div>
        </div>

        {/* Queue Switcher */}
        {allQueues.length > 1 && (
          <div className="mb-10 animate-in" style={{ animationDelay: '0.1s' }}>
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 block">Active Queue</label>
            <select
              value={queueId}
              onChange={(e) => onQueueChange(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
            >
              {allQueues.map(q => (
                <option key={q.id} value={q.id} className="bg-slate-900 text-white">{q.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 space-y-3">
          {navBtn('overview', "Today's Overview", Activity, () => setServiceDate('today'))}
          <button
            onClick={() => { setActiveTab('overview'); setServiceDate('tomorrow'); }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'overview' && serviceDate === 'tomorrow' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Clock size={18} /> Tomorrow's Overview
          </button>
          <div className="h-px w-full bg-white/5 my-6" />
          {navBtn('queue', 'Queue Management', Users)}
          {navBtn('display', 'Display Setup', Monitor)}
          {navBtn('configuration', 'Configuration', Settings)}
          {navBtn('security', 'Security', ShieldCheck)}
        </nav>

        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-4 px-6 py-5 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="px-10 py-10 md:px-16 flex items-center justify-between sticky top-0 z-20 bg-[#020617]/40 backdrop-blur-2xl">
          <div className="animate-in">
            <h2 className="text-4xl font-black text-white tracking-tighter">
              {activeTab === 'overview' ? (serviceDate === 'tomorrow' ? "Tomorrow's Overview" : "Today's Overview")
                : activeTab === 'queue' ? 'Queue Management'
                : activeTab === 'display' ? 'Display Setup'
                : activeTab === 'configuration' ? 'Configuration'
                : 'Security'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">{queueName}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 px-5 py-2.5 glass border-white/10 rounded-full animate-in" style={{ animationDelay: '0.1s' }}>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live</span>
          </div>
        </header>

        <div className="p-10 md:p-16 space-y-14 max-w-7xl">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in" style={{ animationDelay: '0.2s' }}>
                {stats && (
                  <>
                    <StatsCard label="Waiting" value={stats.total_waiting} colour="border-blue-500/10" icon={<Users size={18} className="text-blue-400 opacity-50" />} />
                    <StatsCard label="Active Service" value={stats.total_serving} colour="border-purple-500/10" icon={<Monitor size={18} className="text-purple-400 opacity-50" />} />
                    <StatsCard label="Total Quota" value={dailyLimit > 0 ? `${stats.total_issued}/${dailyLimit}` : '∞'} colour="border-white/5" icon={<ShieldCheck size={18} className="text-slate-400 opacity-50" />} />
                    <StatsCard 
                      label={mlPrediction?.is_ml_trained ? "AI Predict" : "Live Predict"} 
                      value={mlPrediction ? `${Math.round(mlPrediction.estimated_wait_minutes)}m` : '--'} 
                      colour="border-amber-500/10" 
                      icon={mlPrediction?.is_ml_trained ? <Brain size={18} className="text-amber-400 opacity-50" /> : <Clock size={18} className="text-amber-400 opacity-50" />} 
                    />
                  </>
                )}
              </div>

              <div className="grid xl:grid-cols-12 gap-10 mt-14">
                <div className="xl:col-span-7 space-y-10 animate-in" style={{ animationDelay: '0.3s' }}>
                  <section className="glass-card !p-12 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
                    <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-12 relative z-10">Console Actions</h3>
                    {opData?.next_token ? (
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div>
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Upcoming Priority</p>
                          <div className="scale-110 origin-left">
                            <TokenBadge number={opData.next_token.number} status="called" size="lg" />
                          </div>
                          {opData.next_token.phone && (
                            <div className="flex gap-3 mt-10">
                              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                <Phone size={12} className="text-slate-500" />
                                <span className="text-slate-300 font-bold text-xs tracking-wide">{opData.next_token.phone}</span>
                              </div>
                              <div className="flex items-center gap-3 bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/60">PIN:</span>
                                <span className="text-blue-100 font-black text-sm tracking-[0.2em]">{opData.next_token.verification_pin}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-4 w-full md:w-auto">
                          <button onClick={handleCallNext} disabled={calling} className="h-20 btn-premium px-16 min-w-[200px]">
                            {calling ? <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span className="flex items-center gap-3 text-sm">Call Next <ArrowRight size={20} /></span>}
                          </button>
                          <button onClick={() => handleSkip(opData.next_token.id)} className="h-14 font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 hover:text-red-400 transition-all">
                            Mark as No Show
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 py-20 text-center glass rounded-[2rem] border-dashed border-white/5">
                        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Queue Fully Resolved</p>
                      </div>
                    )}
                  </section>

                  <section className="animate-in" style={{ animationDelay: '0.4s' }}>
                    <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-8 ml-6">Under Professional Care</h3>
                    {opData?.serving_tokens?.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {opData.serving_tokens.map((t: any) => (
                          <div key={t.id} className="glass-card !p-8 flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                              <TokenBadge number={t.number} status="serving" size="md" />
                              <div className="text-right">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pass Code</p>
                                <p className="text-blue-200 font-black text-sm tracking-[0.2em]">{t.verification_pin}</p>
                              </div>
                            </div>
                            <button onClick={() => handleComplete(t.id)} className="w-full h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-500 hover:text-white transition-all">
                              Complete Service
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="glass rounded-[2.5rem] border-dashed border-white/5 p-16 text-center">
                        <p className="text-slate-700 font-black uppercase tracking-[0.4em] text-[10px]">Awaiting Priority Assignments</p>
                      </div>
                    )}
                  </section>
                </div>

                <div className="xl:col-span-5 animate-in" style={{ animationDelay: '0.4s' }}>
                  <section className="glass rounded-[2.5rem] p-10 h-full">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Upcoming Flow</h3>
                      <span className="badge-premium !text-blue-400 bg-blue-500/10 border-blue-500/20">{opData?.waiting_tokens?.length ?? 0}</span>
                    </div>
                    {opData?.waiting_tokens?.length > 0 ? (
                      <div className="space-y-4 overflow-y-auto max-h-[700px] pr-4 custom-scroll">
                        {opData.waiting_tokens.map((t: any, i: number) => (
                          <div key={t.id} className="group flex items-center gap-5 glass rounded-2xl p-5 border-white/[0.03] hover:border-white/10 transition-all duration-500">
                            <span className="text-slate-800 text-[10px] font-black w-4">{i + 1}</span>
                            <TokenBadge number={t.number} status="waiting" size="sm" />
                            <div className="flex-1" />
                            {t.estimated_wait_minutes && (
                              <div className="text-right">
                                <p className="text-amber-500/80 font-black text-xs font-mono">{Math.round(t.estimated_wait_minutes)}m</p>
                                <p className="text-[8px] uppercase tracking-tighter text-slate-700 font-black">Est. Wait</p>
                              </div>
                            )}
                            <ChevronRight size={14} className="text-slate-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">System Idle</p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ── QUEUE MANAGEMENT TAB ── */}
          {activeTab === 'queue' && (
            <div className="animate-in glass-card !p-12">
              <h3 className="text-2xl font-black text-white mb-6">Queue Management</h3>
              <p className="text-slate-400 mb-10">Manage quota settings for <span className="text-white font-bold">{queueName}</span>.</p>
              <div className="max-w-md">
                <div className="glass p-8 rounded-2xl border-white/5">
                  <h4 className="text-sm font-black text-white mb-1">Daily Token Limit</h4>
                  <p className="text-xs text-slate-500 mb-6">Set the maximum tokens issued per day. Set to 0 for unlimited.</p>
                  <div className="flex gap-4">
                    <input
                      id="dailyLimitInput"
                      type="text"
                      value={localDailyLimit}
                      onChange={(e) => setLocalDailyLimit(e.target.value.replace(/[^0-9]/g, ''))}
                      className="input-premium h-14 text-lg flex-1"
                      placeholder="0 = Unlimited"
                    />
                    <button onClick={updateDailyLimit} disabled={isUpdatingLimit} className="btn-premium px-8">
                      {isUpdatingLimit ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {dailyLimit > 0 && (
                    <p className="text-[10px] text-slate-600 mt-4">Current limit: <span className="text-blue-400 font-bold">{dailyLimit} tokens/day</span></p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── DISPLAY SETUP TAB ── */}
          {activeTab === 'display' && (
            <div className="animate-in glass-card !p-12">
              <h3 className="text-2xl font-black text-white mb-6">Display Setup</h3>
              <p className="text-slate-400 mb-10">Configure public displays and open the user-facing portal.</p>
              <div className="space-y-8">
                {/* User Portal quick-open */}
                <div className="glass p-8 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h4 className="text-base font-black text-white mb-1">User Portal</h4>
                    <p className="text-xs text-slate-500">Open the customer-facing queue portal where users can join the queue.</p>
                  </div>
                  <a
                    href="/?view=user"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-premium px-10 h-12 text-xs shrink-0 flex items-center gap-2"
                  >
                    Open Portal <ArrowRight size={16} />
                  </a>
                </div>

                {/* Public Display */}
                <div className="glass p-10 rounded-3xl border-dashed border-white/10 text-center">
                  <Monitor size={48} className="text-blue-500/50 mx-auto mb-6" />
                  <h4 className="text-lg font-black text-white mb-2">Lobby Display URL</h4>
                  <p className="text-sm text-slate-500 mb-8">Open this on your TV or public screen to show the live queue status.</p>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <code className="bg-black/50 px-6 py-4 rounded-xl text-blue-400 font-mono text-sm border border-white/5 break-all">
                      {window.location.origin}/?view=display
                    </code>
                    <a
                      href="/?view=display"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-premium px-6 h-[54px]"
                    >
                      Open Display
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CONFIGURATION TAB ── */}
          {activeTab === 'configuration' && (
            <div className="animate-in max-w-2xl">
              <div className="glass-card !p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <Settings size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Queue Configuration</h3>
                    <p className="text-xs text-slate-500 mt-1">Update the public-facing details of your service queue.</p>
                  </div>
                </div>

                {configMsg && (
                  <div className={`flex items-center gap-3 p-5 rounded-2xl mb-8 text-sm font-bold ${
                    configMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    <CheckCircle2 size={18} />
                    <span>{configMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateConfiguration} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Queue Name</label>
                    <input 
                      id="configNameInput"
                      type="text" 
                      value={configName}
                      onChange={e => setConfigName(e.target.value)}
                      className="input-premium h-14 text-lg" 
                      placeholder="e.g., Main Reception" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Description (Optional)</label>
                    <textarea 
                      id="configDescInput"
                      value={configDesc}
                      onChange={e => setConfigDesc(e.target.value)}
                      className="input-premium py-4 text-sm resize-none h-32" 
                      placeholder="What is this queue used for?" 
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button type="submit" disabled={configLoading} className="btn-premium w-full h-14">
                      {configLoading ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Create New Queue */}
              <div className="glass-card !p-12 mt-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                    <Users size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Create Additional Queue</h3>
                    <p className="text-xs text-slate-500 mt-1">Add a new service queue (e.g. Pharmacy, Billing) to this organization.</p>
                  </div>
                </div>

                {createQueueMsg && (
                  <div className={`flex items-center gap-3 p-5 rounded-2xl mb-8 text-sm font-bold ${
                    createQueueMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    <CheckCircle2 size={18} />
                    <span>{createQueueMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleCreateQueue} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">New Queue Name</label>
                    <input 
                      type="text" 
                      value={newQueueName}
                      onChange={e => setNewQueueName(e.target.value)}
                      className="input-premium h-14 text-lg" 
                      placeholder="e.g., Fast Track" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Description (Optional)</label>
                    <textarea 
                      value={newQueueDesc}
                      onChange={e => setNewQueueDesc(e.target.value)}
                      className="input-premium py-4 text-sm resize-none h-24" 
                      placeholder="Short purpose of this new queue..." 
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button type="submit" disabled={createQueueLoading || !newQueueName} className="w-full h-14 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all">
                      {createQueueLoading ? 'Creating...' : 'Create Queue'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <div className="animate-in space-y-10">
              {/* Change PIN */}
              <div className="glass-card !p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <KeyRound size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Change Admin PIN</h3>
                    <p className="text-xs text-slate-500 mt-1">Update the 4-digit PIN used to access the admin console.</p>
                  </div>
                </div>
                {pwMsg && (
                  <div className={`flex items-center gap-3 p-5 rounded-2xl mb-8 text-sm font-bold ${
                    pwMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {pwMsg.type === 'success' ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}
                    <span>{pwMsg.text}</span>
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="max-w-sm space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Current PIN</label>
                    <input type="password" inputMode="numeric" maxLength={8} value={pwCurrent}
                      onChange={e => setPwCurrent(e.target.value.replace(/\D/g, ''))}
                      className="input-premium h-14 tracking-[0.3em] text-lg" placeholder="Current 4-digit PIN" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">New PIN</label>
                    <input type="password" inputMode="numeric" maxLength={8} value={pwNew}
                      onChange={e => setPwNew(e.target.value.replace(/\D/g, ''))}
                      className="input-premium h-14 tracking-[0.3em] text-lg" placeholder="New 4-digit PIN" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Confirm New PIN</label>
                    <input type="password" inputMode="numeric" maxLength={8} value={pwConfirm}
                      onChange={e => setPwConfirm(e.target.value.replace(/\D/g, ''))}
                      className="input-premium h-14 tracking-[0.3em] text-lg" placeholder="Repeat new PIN" required />
                  </div>
                  <button type="submit" disabled={pwLoading} className="btn-premium w-full h-14 mt-2">
                    {pwLoading ? 'Updating...' : 'Update PIN'}
                  </button>
                </form>
              </div>

              {/* ML Model Management */}
              <div className="glass-card !p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                    <Brain size={22} className="text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">AI Wait-Time Model</h3>
                    <p className="text-xs text-slate-500 mt-1">Bootstrap the ML model with synthetic data so it starts predicting immediately.</p>
                  </div>
                </div>
                {mlMsg && (
                  <div className="flex items-center gap-3 p-5 rounded-2xl mb-8 text-sm font-bold bg-violet-500/10 border border-violet-500/20 text-violet-300">
                    <CheckCircle2 size={18} /><span>{mlMsg}</span>
                  </div>
                )}
                <button onClick={handleSeedML} disabled={mlSeeding}
                  className="h-14 px-10 bg-violet-600/10 border border-violet-500/20 text-violet-400 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50">
                  {mlSeeding ? 'Training...' : 'Seed & Train ML Model'}
                </button>
                <p className="text-[10px] text-slate-600 mt-4">Generates 200 realistic records and trains immediately. Only needed once — real data accumulates automatically as tokens are completed.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
