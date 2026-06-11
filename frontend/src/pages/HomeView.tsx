import { useState, useEffect } from 'react';
import type { AppView } from '../App';
import { Users, ShieldCheck, Monitor, ArrowRight, Zap } from 'lucide-react';

interface HomeViewProps {
  orgId: string;
  setView: (v: AppView) => void;
  onReset: () => void;
  onSelectQueue: (qId: string) => void;
}

export default function HomeView({ setView }: HomeViewProps) {
  const [hasActiveTicket, setHasActiveTicket] = useState(false);

  useEffect(() => {
    setHasActiveTicket(!!localStorage.getItem('palo_active_token_id'));
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 bg-[#0a0f1e]">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-violet-600/6 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">Pālo</span>
            <span className="ml-2 text-xs text-slate-500 font-medium hidden sm:inline">Queue System</span>
          </div>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-slate-400">Live</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-14 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <span className="text-blue-400 text-xs font-semibold">No more long waits</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-5 leading-[1.1] tracking-tight">
            Your digital<br />
            <span className="text-gradient-brand">queue ticket.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Join the queue from anywhere. Track your position in real time. We'll let you know when it's your turn.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-5 w-full max-w-3xl animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {/* User Card */}
          <button
            id="btn-join-queue"
            onClick={() => setView('user')}
            className="group text-left p-7 rounded-2xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Users size={22} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {hasActiveTicket ? 'My Active Ticket' : 'Join the Queue'}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                {hasActiveTicket
                  ? 'You have an active ticket. Tap to check your current position and status.'
                  : 'Get your digital token in seconds. Just enter your name and phone number.'}
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                {hasActiveTicket ? 'View Ticket' : 'Get My Ticket'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>

          {/* Admin Card */}
          <button
            id="btn-staff-login"
            onClick={() => setView('admin-login')}
            className="group text-left p-7 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-black/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck size={22} className="text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Staff Login</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                For office staff only. Manage the queue, call the next person, and view live statistics.
              </p>
              <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm">
                Access Console
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pb-8 text-slate-700 text-xs">
        Pālo Queue Management &nbsp;·&nbsp; Smart. Simple. Fast.
      </footer>
    </div>
  );
}
