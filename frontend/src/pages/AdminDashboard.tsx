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
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [serviceDate, setServiceDate] = useState<string>(todayStr());
  const [activeTab, setActiveTab] = useState<'overview' | 'display' | 'settings'>('overview');
  const [isActive, setIsActive] = useState<boolean>(true);

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
      if (document.activeElement?.id !== 'configActiveInput') {
        setIsActive(qRes.data.active === 1);
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

  const handleUpdateConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true); setConfigMsg(null);
    try {
      const newLimit = parseInt(localDailyLimit) || 0;
      await queueAPI.update(queueId, { 
        name: configName, 
        description: configDesc,
        daily_limit: newLimit,
        active: isActive ? 1 : 0
      });
      setDailyLimit(newLimit);
      setConfigMsg({ type: 'success', text: 'Queue settings updated successfully.' });
      await fetchAll();
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update settings.' });
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
        activeTab === tab
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
      }`}
    >
      <Icon size={17} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen text-slate-100 flex flex-col lg:flex-row selection:bg-blue-500/30 relative pb-16 lg:pb-0">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-white/[0.06] bg-[#0d1525]/80 backdrop-blur-2xl p-7 sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 pb-7 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white tracking-tight">Pālo Console</p>
            <p className="text-xs text-slate-500 font-medium">Staff Dashboard</p>
          </div>
        </div>

        {/* Queue Switcher */}
        {allQueues.length > 1 && (
          <div className="mb-6">
            <label className="text-xs font-semibold text-slate-500 mb-2 block">Active Queue</label>
            <div className="relative">
              <select
                value={queueId}
                onChange={(e) => onQueueChange(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer outline-none"
              >
                {allQueues.map(q => (
                  <option key={q.id} value={q.id} className="bg-slate-900 text-white">{q.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1.5">
          {navBtn('overview', 'Live Workspace', Activity)}
          <div className="h-px bg-white/[0.05] my-3" />
          {navBtn('display', 'Lobby Displays', Monitor)}
          {navBtn('settings', 'System Settings', Settings)}
        </nav>

        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl font-semibold text-sm transition-all border border-transparent hover:border-red-500/10"
        >
          <LogOut size={17} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="px-8 py-6 flex items-center justify-between sticky top-0 z-20 bg-[#0a0f1e]/60 backdrop-blur-xl border-b border-white/[0.06]">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'overview' ? 'Live Workspace'
                : activeTab === 'display' ? 'Lobby Displays'
                : 'System Settings'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              <p className="text-slate-500 text-xs font-medium">{queueName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'overview' && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                <input
                  type="date"
                  value={serviceDate}
                  onChange={e => setServiceDate(e.target.value)}
                  className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            )}
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-full">
              <span className="live-dot" />
              <span className="text-xs font-semibold text-slate-300">Live</span>
            </div>
          </div>
        </header>

        <div className="p-10 md:p-16 space-y-14 max-w-7xl">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in" style={{ animationDelay: '0.2s' }}>
                {stats && (
                  <>
                    <StatsCard 
                      label="Next Turn" 
                      value={opData?.next_token ? `#${opData.next_token.number}` : '—'} 
                      icon={<ChevronRight size={18} className="text-blue-400 opacity-50" />} 
                    />
                    <StatsCard 
                      label="Served Today" 
                      value={stats.total_completed_today} 
                      icon={<CheckCircle2 size={18} className="text-emerald-400 opacity-50" />} 
                    />
                    <StatsCard 
                      label="Skipped Today" 
                      value={stats.total_skipped} 
                      icon={<Users size={18} className="text-red-400 opacity-50" />} 
                    />
                    <StatsCard 
                      label="Waiting In Queue" 
                      value={stats.total_waiting} 
                      icon={<Users size={18} className="text-purple-400 opacity-50" />} 
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
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-4">Next in Queue</p>
                          <div className="flex items-center gap-5 flex-wrap">
                            <TokenBadge number={opData.next_token.number} status="called" size="lg" />
                            <div>
                              {opData.next_token.name && <p className="text-white font-bold text-lg">{opData.next_token.name}</p>}
                              {opData.next_token.phone && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone size={12} className="text-slate-500" />
                                  <span className="text-slate-400 text-sm">{opData.next_token.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg w-fit">
                                <span className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider">PIN:</span>
                                <span className="text-blue-200 font-bold text-sm tracking-[0.2em]">{opData.next_token.verification_pin}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                          <button onClick={handleCallNext} disabled={calling} className="h-14 btn-primary px-10 min-w-[180px]">
                            {calling ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span className="flex items-center gap-2">Call Next <ArrowRight size={18} /></span>}
                          </button>
                          <button onClick={() => handleSkip(opData.next_token.id)} className="h-10 font-medium text-sm text-slate-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 rounded-xl">
                            Mark as No-Show
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
                          <div key={t.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <TokenBadge number={t.number} status="serving" size="md" />
                                {t.name && <p className="text-slate-300 font-semibold text-sm mt-2">{t.name}</p>}
                                {t.phone && <p className="text-slate-500 text-xs mt-0.5">{t.phone}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Verification</p>
                                <p className="text-blue-300 font-bold text-lg tracking-[0.2em]">{t.verification_pin}</p>
                              </div>
                            </div>
                            <button onClick={() => handleComplete(t.id)} className="w-full h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                              ✓ Complete Service
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
                          <div key={t.id} className="group flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:border-white/10 transition-all duration-300">
                            <span className="text-slate-600 text-xs font-bold w-5 shrink-0">{i + 1}</span>
                            <TokenBadge number={t.number} status="waiting" size="sm" />
                            <div className="flex-1 min-w-0">
                              {t.name && <p className="text-slate-200 font-semibold text-sm truncate">{t.name}</p>}
                              {t.phone && <p className="text-slate-500 text-xs truncate">{t.phone}</p>}
                            </div>
                            {t.estimated_reporting_time && (
                              <div className="text-right shrink-0">
                                <p className="text-blue-400 font-bold text-sm">{t.estimated_reporting_time}</p>
                                <p className="text-xs text-slate-600">report by</p>
                              </div>
                            )}
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

          {/* ── SYSTEM SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in">
              
              {/* Left Column: Queue Params & New Queue */}
              <div className="space-y-10">
                {/* Queue Parameters Card */}
                <div className="glass-card !p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <Settings size={22} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Queue Parameters</h3>
                      <p className="text-xs text-slate-500 mt-1">Configure service settings and daily token limit.</p>
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Description</label>
                      <textarea 
                        id="configDescInput"
                        value={configDesc}
                        onChange={e => setConfigDesc(e.target.value)}
                        className="input-premium py-4 text-sm resize-none h-24" 
                        placeholder="What is this queue used for?" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Daily Token Limit</label>
                      <input 
                        id="dailyLimitInput"
                        type="text" 
                        value={localDailyLimit}
                        onChange={(e) => setLocalDailyLimit(e.target.value.replace(/[^0-9]/g, ''))}
                        className="input-premium h-14 text-lg" 
                        placeholder="0 = Unlimited" 
                      />
                      <p className="text-[10px] text-slate-500">Set the maximum tokens issued per day. Set to 0 for unlimited.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] p-4 rounded-xl">
                      <input
                        id="configActiveInput"
                        type="checkbox"
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className="w-5 h-5 rounded border-white/[0.08] bg-slate-950 text-blue-500 focus:ring-blue-500/10 focus:ring-2 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="configActiveInput" className="text-sm font-bold text-white cursor-pointer select-none">Active Status</label>
                        <p className="text-[10px] text-slate-500">Allow users to book tokens in this queue. Inactive queues are hidden.</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button type="submit" disabled={configLoading} className="btn-primary w-full h-14">
                        {configLoading ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Create Additional Queue Card */}
                <div className="glass-card !p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                      <Users size={22} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Create Additional Service</h3>
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Description</label>
                      <textarea 
                        value={newQueueDesc}
                        onChange={e => setNewQueueDesc(e.target.value)}
                        className="input-premium py-4 text-sm resize-none h-20" 
                        placeholder="Short description of this new queue..." 
                      />
                    </div>
                    
                    <div className="pt-2">
                      <button type="submit" disabled={createQueueLoading || !newQueueName} className="w-full h-14 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all">
                        {createQueueLoading ? 'Creating...' : 'Create Queue'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Security PIN & ML Seeding */}
              <div className="space-y-10">
                {/* Change PIN Card */}
                <div className="glass-card !p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <KeyRound size={22} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Change Admin PIN</h3>
                      <p className="text-xs text-slate-500 mt-1">Update the 4-digit PIN used to access this admin console.</p>
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

                  <form onSubmit={handleChangePassword} className="space-y-5">
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
                    
                    <button type="submit" disabled={pwLoading} className="btn-primary w-full h-14 mt-2">
                      {pwLoading ? 'Updating...' : 'Update PIN'}
                    </button>
                  </form>
                </div>

                {/* ML Model Management Card */}
                <div className="glass-card !p-10">
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
                    className="h-14 px-10 bg-violet-600/10 border border-violet-500/20 text-violet-400 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-violet-600 hover:text-white transition-all w-full disabled:opacity-50">
                    {mlSeeding ? 'Training...' : 'Seed & Train ML Model'}
                  </button>
                  <p className="text-[10px] text-slate-600 mt-4 leading-relaxed">Generates 200 realistic wait records and trains immediately. Only needed once — real waiting data accumulates automatically as tokens are completed.</p>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1525]/95 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-2 py-2">
        {[
          { tab: 'overview' as const, label: 'Workspace', Icon: Activity },
          { tab: 'display' as const, label: 'Displays', Icon: Monitor },
          { tab: 'settings' as const, label: 'Settings', Icon: Settings },
        ].map(({ tab, label, Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
              activeTab === tab
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold text-slate-500 hover:text-red-400"
        >
          <LogOut size={20} />
          Logout
        </button>
      </nav>
    </div>
  );
}
