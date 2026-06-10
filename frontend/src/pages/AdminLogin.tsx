import { useState } from 'react';
import { ShieldAlert, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

const ADMIN_PIN = '1234';

interface AdminLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onSuccess, onBack }: AdminLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN) {
          onSuccess();
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => { setShake(false); setPin(''); }, 600);
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    if (pin.length === 0) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden selection:none">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-2xl border border-white/5"
      >
        <ArrowLeft size={18} /> Home
      </button>

      <div className={`w-full max-w-sm animate-in transition-transform duration-500 ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center mb-12">
          <div className="w-24 h-24 glass rounded-[2rem] flex items-center justify-center mx-auto mb-10 relative group">
            <div className={`absolute inset-0 rounded-[2rem] transition-opacity duration-700 blur-2xl ${error ? 'bg-red-500/20' : 'bg-blue-500/20'}`} />
            <div className="relative z-10 glass w-full h-full rounded-[2rem] flex items-center justify-center border-white/10">
                {error 
                ? <ShieldAlert size={36} className="text-red-500" /> 
                : <Lock size={36} className={`${pin.length > 0 ? 'text-blue-400' : 'text-slate-600'} transition-colors duration-500`} />
                }
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">Staff Access</h1>
          <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-[9px]">Identity Verification Required</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-6 mb-14">
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-500 border-2 ${
                pin.length > i
                  ? (error ? 'bg-red-500 border-red-400 scale-125 glow-blue !shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-blue-500 border-blue-400 scale-125 glow-blue')
                  : 'bg-transparent border-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Custom Numpad */}
        <div className="grid grid-cols-3 gap-5">
          {keys.map((key, i) => (
            <button
              key={i}
              onClick={() => {
                if (key === '⌫') handleDelete();
                else if (key !== '') handleDigit(key);
              }}
              disabled={key === ''}
              className={`h-20 rounded-[2rem] text-2xl font-black transition-all duration-300 active:scale-95 flex items-center justify-center ${
                key === ''
                  ? 'bg-transparent cursor-default'
                  : key === '⌫'
                    ? 'glass hover:bg-white/5 text-slate-500'
                    : 'glass text-white hover:bg-white/10 hover:border-blue-500/30'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {error && (
            <div className="mt-12 flex items-center justify-center gap-3">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em]">Access Denied</p>
            </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}
