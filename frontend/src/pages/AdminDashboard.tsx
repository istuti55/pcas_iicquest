import { useState, useEffect } from 'react';
import { queueAPI, tokenAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import TokenBadge from '../components/TokenBadge';
import {
  Users, CheckCircle, Clock, Monitor,
  ChevronRight, LogOut, Phone, Hash,
  ArrowRight, ShieldCheck, Activity
} from 'lucide-react';

interface AdminDashboardProps {
  queueId: string;
  onLogout: () => void;
}

interface Token { id: string; number: number; phone?: string; email?: string; state: string; estimated_wait_minutes?: number; }

export default function AdminDashboard({ queueId, onLogout }: AdminDashboardProps) {
  const [queueName, setQueueName] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [opData, setOpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<number>(0);
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);

  const fetchAll = async () => {
    try {
      const [qRes, sRes, opRes] = await Promise.all([
        queueAPI.get(queueId),
        queueAPI.getStats(queueId),
        queueAPI.getOperatorView(queueId),
      ]);
      setQueueName(qRes.data.name);
      setDailyLimit(qRes.data.daily_limit || 0);
      setStats(sRes.data);
      setOpData(opRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => clearInterval(t);
  }, [queueId]);

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
    try {
      await tokenAPI.updateState(id, 'completed');
      await fetchAll();
    } catch {}
  };

  const handleSkip = async (id: string) => {
    try {
      await tokenAPI.updateState(id, 'no_show');
      await fetchAll();
    } catch {}
  };

  const updateDailyLimit = async () => {
    setIsUpdatingLimit(true);
    try {
      await queueAPI.update(queueId, { daily_limit: dailyLimit });
      await fetchAll();
    } catch {}
    setIsUpdatingLimit(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 flex selection:bg-blue-500/30">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-80 flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl p-10 sticky top-0 h-screen">
        <div className="flex items-center gap-4 mb-14">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all rounded-full" />
            <ShieldCheck size={28} className="text-blue-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">Pālo Console</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          <button className="w-full flex items-center gap-4 px-6 py-4 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 font-black text-xs uppercase tracking-widest transition-all">
            <Activity size={18} /> Overview
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
            <Users size={18} /> Queue Management
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
            <Monitor size={18} /> Display Setup
          </button>
        </nav>

        {/* Queue Settings in Sidebar */}
        <div className="mt-10 pt-10 border-t border-white/5">
           <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-8">System Quotas</h3>
           <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Daily Token Limit</label>
                 <div className="flex gap-2">
                    <input 
                       type="number" 
                       value={dailyLimit}
                       onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                       className="input-premium h-12 text-sm !px-4"
                       placeholder="Unlimited"
                    />
                    <button 
                       onClick={updateDailyLimit}
                       disabled={isUpdatingLimit}
                       className="px-4 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 font-black text-[10px] uppercase tracking-widest"
                    >
                       {isUpdatingLimit ? '...' : 'Save'}
                    </button>
                 </div>
                 <p className="text-[9px] text-slate-600 leading-relaxed px-2">Threshold for new joiners today</p>
              </div>
           </div>
        </div>

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
            <h2 className="text-4xl font-black text-white tracking-tighter">Operational Overview</h2>
            <div className="flex items-center gap-3 mt-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">{queueName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-3 px-5 py-2.5 glass border-white/10 rounded-full animate-in" style={{ animationDelay: '0.1s' }}>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Status</span>
            </div>
          </div>
        </header>

        <div className="p-10 md:p-16 space-y-14 max-w-7xl">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in" style={{ animationDelay: '0.2s' }}>
            {stats && (
              <>
                <StatsCard label="Waiting" value={stats.total_waiting} colour="border-blue-500/10" icon={<Users size={18} className="text-blue-400 opacity-50" />} />
                <StatsCard label="Active Service" value={stats.total_serving} colour="border-purple-500/10" icon={<Monitor size={18} className="text-purple-400 opacity-50" />} />
                <StatsCard label="Total Quota" value={dailyLimit > 0 ? `${stats.total_completed_today + stats.total_waiting + stats.total_serving}/${dailyLimit}` : '∞'} colour="border-white/5" icon={<ShieldCheck size={18} className="text-slate-400 opacity-50" />} />
                <StatsCard label="Load Time" value={stats.avg_wait_time ? `${Math.round(stats.avg_wait_time)}m` : '--'} colour="border-amber-500/10" icon={<Clock size={18} className="text-amber-400 opacity-50" />} />
              </>
            )}
          </div>

          <div className="grid xl:grid-cols-12 gap-10">
            {/* Primary Action Panel */}
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
                        <button
                          onClick={handleCallNext}
                          disabled={calling}
                          className="h-20 btn-premium px-16 min-w-[200px]"
                        >
                          {calling ? (
                            <span className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span className="flex items-center gap-3 text-sm">Call Next <ArrowRight size={20} /></span>
                          )}
                        </button>
                        <button
                          onClick={() => handleSkip(opData.next_token.id)}
                          className="h-14 font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 hover:text-red-400 transition-all"
                        >
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

              {/* Serving Panel */}
              <section className="animate-in" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-8 ml-6">Under Professional Care</h3>
                {opData?.serving_tokens?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {opData.serving_tokens.map((t: any) => (
                      <div key={t.id} className="glass-card !p-8 flex flex-col gap-8 relative group">
                        <div className="flex items-center justify-between">
                            <TokenBadge number={t.number} status="serving" size="md" />
                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pass Code</p>
                               <p className="text-blue-200 font-black text-sm tracking-[0.2em]">{t.verification_pin}</p>
                            </div>
                        </div>
                        <button
                          onClick={() => handleComplete(t.id)}
                          className="w-full h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/20"
                        >
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

            {/* Sidebar List (Waiting) */}
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
        </div>
      </main>
    </div>
  );
}
