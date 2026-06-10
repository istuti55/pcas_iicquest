import { useState, useEffect } from 'react';
import { queueAPI } from '../services/api';
import TokenBadge from '../components/TokenBadge';
import { ArrowLeft, Clock, Users, Activity, Monitor } from 'lucide-react';

interface DisplayBoardProps {
  queueId: string;
  onBack: () => void;
}

export default function DisplayBoard({ queueId, onBack }: DisplayBoardProps) {
  const [opData, setOpData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const [opRes, sRes] = await Promise.all([
          queueAPI.getOperatorView(queueId),
          queueAPI.getStats(queueId),
        ]);
        setOpData(opRes.data);
        setStats(sRes.data);
      } catch {}
      setLoading(false);
    };
    load();
    const dataTimer = setInterval(load, 2500);
    const clockTimer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(dataTimer); clearInterval(clockTimer); };
  }, [queueId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#030303] flex items-center justify-center font-['Outfit']">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#030303] text-slate-100 flex flex-col font-['Outfit'] overflow-hidden selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* Header */}
      <header className="relative z-10 px-12 py-10 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="animate-in">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Activity size={24} className="text-white" />
             </div>
             <h1 className="text-4xl font-black tracking-tighter text-white">Lobby Display</h1>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs pl-1">Department: {opData?.queue_name || 'Main Reception'}</p>
        </div>

        <div className="text-right animate-in" style={{ animationDelay: '0.1s' }}>
          <p className="text-4xl font-black text-white tracking-tight">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 flex-1 grid lg:grid-cols-12 gap-8 p-10 overflow-hidden">
        
        {/* NOW SERVING - Left Panel */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col animate-in" style={{ animationDelay: '0.2s' }}>
           <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-[3rem] p-10 flex flex-col h-full shadow-2xl shadow-emerald-900/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />

              <h2 className="text-emerald-500 text-sm font-black uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                 <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                 Ready to Serve
              </h2>

              <div className="flex-1 flex flex-col items-center justify-center">
                 {opData?.serving_tokens?.length > 0 ? (
                    <div className="space-y-8 w-full">
                       {opData.serving_tokens.map((t: any) => (
                          <div key={t.id} className="text-center animate-in scale-110">
                             <TokenBadge number={t.number} status="called" size="lg" />
                             <p className="mt-8 text-emerald-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Proceed to Counter 01</p>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center opacity-30">
                       <Monitor size={84} className="mx-auto mb-6 text-slate-400" />
                       <p className="text-2xl font-black uppercase tracking-widest text-slate-500">Wait for Signal</p>
                    </div>
                 )}
              </div>

              {/* Quick stats at bottom of panel */}
              <div className="mt-12 grid grid-cols-2 gap-4">
                 <div className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center">
                    <p className="text-4xl font-black text-blue-400 mb-1">{stats?.total_waiting ?? 0}</p>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">In Line</p>
                 </div>
                 <div className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center">
                    <p className="text-4xl font-black text-amber-400 mb-1">{stats?.avg_wait_time ? Math.round(stats.avg_wait_time) : '—'}</p>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Min Wait</p>
                 </div>
              </div>
           </div>
        </div>

        {/* WAITING LIST - Right Panel */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col animate-in" style={{ animationDelay: '0.3s' }}>
           <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-10 flex flex-col h-full shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-600/0 via-blue-600/50 to-blue-600/0" />
              
              <h2 className="text-slate-400 text-sm font-black uppercase tracking-[0.4em] mb-12">Waiting Sequence</h2>

              {opData?.waiting_tokens?.length > 0 ? (
                 <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-2 custom-scroll scrollbar-hide">
                    {opData.waiting_tokens.map((t: any, i: number) => (
                       <div key={t.id} className="bg-white/[0.04] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:bg-blue-600/10 hover:border-blue-500/20 transition-all duration-500 animate-in" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                          <div>
                             <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest mb-3">Pos {i + 1}</p>
                             <TokenBadge number={t.number} status="waiting" size="md" />
                          </div>
                          {t.estimated_wait_minutes != null && (
                             <div className="text-right">
                                <p className="text-blue-400 font-black text-2xl font-mono leading-none">{Math.round(t.estimated_wait_minutes)}m</p>
                                <p className="text-[10px] uppercase font-black text-slate-600 tracking-tighter mt-1">Estim. Wait</p>
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                    <Users size={64} className="mb-6 mb-4" />
                    <p className="text-xl font-black uppercase tracking-[0.3em]">All Clear</p>
                 </div>
              )}
           </div>
        </div>
      </main>

      {/* Ticker Footer */}
      <footer className="bg-blue-600 px-12 py-3 flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-glow" style={{ backgroundSize: '200% 100%' }} />
        <p className="relative z-10 text-blue-100 text-xs font-black uppercase tracking-[0.3em]">
           Welcome to Pālo Queue Management System • Please monitor your token number • Stay updated via your mobile portal
        </p>
      </footer>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
