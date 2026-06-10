import { useState, useEffect } from 'react';
import { tokenAPI, queueAPI } from '../services/api';
import TokenBadge from '../components/TokenBadge';
import { ArrowLeft, CheckCircle, Clock, Hash, Users, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface UserPortalProps {
  queueId: string;
  onBack: () => void;
}

export default function UserPortal({ queueId, onBack }: UserPortalProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<any>(null);
  const [serviceDate, setServiceDate] = useState<'today' | 'tomorrow'>('today');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [totalWaiting, setTotalWaiting] = useState<number>(0);

  useEffect(() => {
    if (!token) return;
    const refresh = async () => {
      try {
        const [tRes, qRes, listRes] = await Promise.all([
          tokenAPI.get(token.id),
          queueAPI.getStats(queueId),
          tokenAPI.list(queueId),
        ]);
        setToken(tRes.data);
        setTotalWaiting(qRes.data.total_waiting);
        const waiting = listRes.data.tokens.filter((t: any) => t.state === 'waiting' || t.state === 'called' || t.state === 'serving');
        const pos = waiting.findIndex((t: any) => t.id === token.id);
        setQueuePosition(pos >= 0 ? pos + 1 : null);
      } catch {}
    };
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [token?.id, queueId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await tokenAPI.create(queueId, { 
        phone: phone || undefined, 
        email: email || undefined,
        service_day: serviceDate
      });
      const newToken = res.data;
      if (newToken.secret_token) {
        localStorage.setItem(`token_secret_${newToken.id}`, newToken.secret_token);
      }
      setToken(newToken);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.detail || 'Restriction active: You cannot join this queue right now.');
      } else {
        setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const handleLeave = () => {
    setToken(null);
    setPhone('');
    setEmail('');
    setQueuePosition(null);
  };

  const isServing = token?.state === 'serving' || token?.state === 'called';
  const isCompleted = token?.state === 'completed';

  // ── Token tracking ─────────────────────────────────────────────────────────
  if (token) {
    return (
      <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <button 
          onClick={handleLeave} 
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-2xl border border-white/5"
        >
          <ArrowLeft size={18} /> Exit
        </button>

        <div className="relative z-10 w-full max-w-lg animate-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Queue Ticket</h2>
            <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px] tracking-[0.4em]">Live Status Update</p>
          </div>

          {/* Ticket Card - The Heart of the Experience */}
          <div className={`glass-card relative mb-10 overflow-hidden group ${isServing ? 'glow-blue' : ''}`}>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 shimmer pointer-events-none opacity-20" />
            
            <div className="relative z-10 text-center">
              <span className={`badge-premium mb-10 inline-block border-white/10 ${
                isServing ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : ''
              }`}>
                {isServing ? '● Active Session' : isCompleted ? '✓ Completed' : 'Waiting in Line'}
              </span>

              <div className="mb-10">
                <p className="text-slate-500 text-[10px] font-black tracking-[.4em] uppercase mb-4">Token Identity</p>
                <div className="scale-125 origin-center inline-block">
                  <TokenBadge 
                    number={token.number} 
                    status={token.state === 'called' ? 'called' : token.state as any} 
                    size="lg" 
                  />
                </div>
              </div>

              {/* Progress visual */}
              {!isCompleted && !isServing && (
                <div className="h-1 w-32 bg-white/5 rounded-full mx-auto mb-10 overflow-hidden">
                  <div className="h-full bg-blue-500/40 w-1/3 animate-[shimmer_2s_infinite]" />
                </div>
              )}

              {isServing && (
                <div className="py-5 px-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl animate-in mb-4">
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[11px] mb-1">Your Turn</p>
                  <p className="text-white font-bold">Please proceed to the counter</p>
                </div>
              )}
            </div>
          </div>

          {/* Verification PIN Display */}
          <div className="glass rounded-[2rem] p-8 mb-10 text-center relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-slate-500 mb-3">Verification Code</p>
            <p className="text-5xl font-black text-white tracking-[0.25em] text-gradient">{token.verification_pin}</p>
            <p className="text-[10px] text-slate-600 mt-4 font-bold border-t border-white/5 pt-4">Present this to the operator</p>
          </div>

          {/* Live Position Info */}
          {!isCompleted && (
            <div className="grid grid-cols-3 gap-6">
              <div className="glass rounded-[2rem] p-6 text-center hover:bg-white/[0.05] transition-colors">
                <Hash size={14} className="text-blue-400 mx-auto mb-3" />
                <p className="text-2xl font-black text-white">{queuePosition ?? '—'}</p>
                <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mt-1">Position</p>
              </div>
              <div className="glass rounded-[2rem] p-6 text-center hover:bg-white/[0.05] transition-colors">
                <Clock size={14} className="text-amber-400 mx-auto mb-3" />
                <p className="text-2xl font-black text-white">
                  {token.estimated_wait_minutes ? Math.round(token.estimated_wait_minutes) : '—'}m
                </p>
                <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mt-1">Wait</p>
              </div>
              <div className="glass rounded-[2rem] p-6 text-center hover:bg-white/[0.05] transition-colors">
                <Users size={14} className="text-purple-400 mx-auto mb-3" />
                <p className="text-2xl font-black text-white">{totalWaiting}</p>
                <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mt-1">Total</p>
              </div>
            </div>
          )}

          {isCompleted && (
            <button
              onClick={handleLeave}
              className="w-full btn-premium"
            >
              Get New Token
            </button>
          )}

          <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Live Connection Syncing
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <button 
        onClick={onBack} 
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-2xl border border-white/5"
      >
        <ArrowLeft size={18} /> Home
      </button>

      <div className="relative z-10 w-full max-w-lg animate-in">
        <div className="text-center mb-12">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-8 relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl group-hover:bg-blue-500/40 transition-all rounded-full" />
            <Sparkles size={32} className="text-blue-400 relative z-10" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">Pālo Portal</h1>
          <p className="text-slate-500 font-medium tracking-[0.2em] uppercase text-[10px]">Secure Queue Registration</p>
        </div>

        {error && (
          <div className="flex items-center gap-4 bg-red-900/20 border border-red-500/20 p-6 rounded-3xl text-red-300 text-sm mb-10 animate-in shadow-2xl backdrop-blur-xl">
            <AlertCircle size={24} className="shrink-0 text-red-500" />
            <p className="font-bold tracking-tight">{error}</p>
          </div>
        )}

        <div className="mb-10 flex gap-2 p-1.5 glass rounded-3xl relative z-10">
          <button
            onClick={() => setServiceDate('today')}
            className={`flex-1 py-4 px-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 ${
              serviceDate === 'today' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setServiceDate('tomorrow')}
            className={`flex-1 py-4 px-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 ${
              serviceDate === 'tomorrow' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Tomorrow
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              className="input-premium h-18 text-xl"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="input-premium h-18 text-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full h-18 btn-premium mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-4">
                <span className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="tracking-[0.2em]">Reserving...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-4">
                Join Queue <ArrowRight size={20} />
              </span>
            )}
          </button>
        </form>

        <div className="mt-14 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 glass rounded-full opacity-60">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Servers Active & Secure</span>
            </div>
        </div>
      </div>
    </div>
  );
}
