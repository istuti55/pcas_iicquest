import { useState, useEffect } from 'react';
import { queueAPI } from '../services/api';
import type { AppView } from '../App';
import { Users, ShieldCheck, Monitor, Settings, ArrowRight } from 'lucide-react';

interface HomeViewProps {
  queueId: string;
  setView: (v: AppView) => void;
  onReset: () => void;
}

export default function HomeView({ queueId, setView, onReset }: HomeViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [queueName, setQueueName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          queueAPI.get(queueId),
          queueAPI.getStats(queueId),
        ]);
        setQueueName(qRes.data.name);
        setStats(sRes.data);
      } catch {}
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [queueId]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 py-10 md:px-16">
        <div className="animate-in flex items-center gap-4">
          <div className="w-10 h-10 glass rounded-xl flex items-center justify-center relative group">
             <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full group-hover:bg-blue-500/40 transition-all" />
             <div className="w-4 h-4 bg-white rounded-full relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Pālo</h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">{queueName || 'Smart Identity'}</p>
          </div>
        </div>
        
        <button
          onClick={onReset}
          className="glass p-3 text-slate-500 hover:text-white transition-all rounded-2xl group animate-in"
          style={{ animationDelay: '0.1s' }}
        >
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-700" />
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-6xl mx-auto w-full pt-20">
        <div className="text-center mb-20 animate-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] text-gradient">
            Modern <br/>
            Queueing.
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto font-medium tracking-tight">
            A premium, end-to-end identity verification and queue management system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* User CTA */}
          <button
            onClick={() => setView('user')}
            className="group glass-card !p-10 text-left relative overflow-hidden"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="glass w-18 h-18 rounded-2xl flex items-center justify-center mb-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3">
              <Users size={36} className="text-blue-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Portal</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">
              Get your digital token, track live progress, and verify your ID.
            </p>
            <div className="flex items-center gap-3 text-blue-400 font-black text-[11px] uppercase tracking-widest">
              Join Queue <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
            </div>
          </button>

          {/* Admin CTA */}
          <button
            onClick={() => setView('admin-login')}
            className="group glass-card !p-10 text-left relative overflow-hidden"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="glass w-18 h-18 rounded-2xl flex items-center justify-center mb-10 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3">
              <ShieldCheck size={36} className="text-slate-300" />
            </div>
            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Manage</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">
              Staff console for counter operations and queue analytics.
            </p>
            <div className="flex items-center gap-3 text-slate-400 font-black text-[11px] uppercase tracking-widest">
              Staff Login <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
            </div>
          </button>
        </div>

        {/* Display Banner */}
        <button
          onClick={() => setView('display')}
          className="mt-14 glass rounded-full px-10 py-5 hover:bg-white/[0.08] transition-all duration-500 animate-in group flex items-center gap-4"
          style={{ animationDelay: '0.5s' }}
        >
          <Monitor size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
          <span className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase">Open Public Display Control</span>
        </button>
      </main>

      {/* Stats Footer */}
      <footer className="w-full relative z-10 px-10 py-12 flex justify-center border-t border-white/5 bg-black/10 backdrop-blur-2xl animate-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center gap-16 md:gap-32 opacity-40 hover:opacity-100 transition-opacity duration-700">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-white tracking-tighter">{stats?.total_waiting ?? 0}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Wait</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-blue-400 tracking-tighter">{stats?.total_serving ?? 0}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Serve</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-emerald-500 tracking-tighter">{stats?.total_completed_today ?? 0}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Done</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
