import { useState, useEffect } from 'react';
import { queueAPI } from '../services/api';
import type { AppView } from '../App';
import { Users, ShieldCheck, Monitor, Settings, ArrowRight } from 'lucide-react';

interface HomeViewProps {
  orgId: string;
  setView: (v: AppView) => void;
  onReset: () => void;
  onSelectQueue: (qId: string) => void;
}

export default function HomeView({ orgId, setView, onReset, onSelectQueue }: HomeViewProps) {
  const [hasActiveTicket, setHasActiveTicket] = useState(false);

  useEffect(() => {
    setHasActiveTicket(!!localStorage.getItem('palo_active_token_id'));
  }, []);

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
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">Smart Identity</p>
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
            Select an active service below to join the waitlist.
          </p>
        </div>

        <div className="w-full max-w-4xl space-y-6 animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* User CTA */}
            <button
              onClick={() => setView('user')}
              className="group glass-card !p-10 text-left relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="glass w-18 h-18 rounded-2xl flex items-center justify-center mb-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3">
                <Users size={36} className="text-blue-400" />
              </div>
              <h3 className="text-3xl font-black text-white mb-3 tracking-tight">
                {hasActiveTicket ? 'Active Ticket' : 'Portal'}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">
                {hasActiveTicket 
                  ? 'Return to your live queue session and track your progress.'
                  : 'Get your digital token, track live progress, and verify your ID.'}
              </p>
              <div className="flex items-center gap-3 text-blue-400 font-black text-[11px] uppercase tracking-widest">
                {hasActiveTicket ? 'View Ticket' : 'Join Queue'} <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
              </div>
            </button>

            {/* Admin CTA */}
            <button
              onClick={() => setView('admin-login')}
              className="group glass-card !p-10 text-left relative overflow-hidden"
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
        </div>

        <div className="flex gap-4 mt-14 animate-in" style={{ animationDelay: '0.4s' }}>
          
          {/* Display Banner */}
          <button
            onClick={() => setView('display')}
            className="glass rounded-full px-8 py-4 hover:bg-white/[0.08] transition-all duration-500 group flex items-center gap-4"
          >
            <Monitor size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
            <span className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase">Display Control</span>
          </button>
        </div>
      </main>
    </div>
  );
}
