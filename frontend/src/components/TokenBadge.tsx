interface TokenBadgeProps {
  number: number;
  status?: 'waiting' | 'serving' | 'completed' | 'called';
  size?: 'sm' | 'md' | 'lg';
}

export default function TokenBadge({ number, status = 'waiting', size = 'md' }: TokenBadgeProps) {
  const statusColors = {
    waiting: 'bg-white/10 text-white border-white/10 shadow-lg shadow-black/50',
    serving: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5',
    completed: 'bg-slate-800/50 text-slate-500 border-slate-800 shadow-none grayscale',
    called: 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.2)] animate-pulse',
  };

  const sizes = {
    sm: 'text-lg px-3 py-1.5 rounded-xl border',
    md: 'text-3xl lg:text-4xl px-6 py-3 rounded-2xl border-2',
    lg: 'text-6xl lg:text-8xl px-12 py-6 rounded-3xl border-4',
  };

  return (
    <div className={`inline-flex items-center justify-center font-black tracking-tighter transition-all duration-500 hover:scale-105 select-none ${statusColors[status]} ${sizes[size]}`}>
      #{number}
    </div>
  );
}
