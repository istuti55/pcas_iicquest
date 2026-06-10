import { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  colour: string;
  icon: ReactNode;
  subtitle?: string;
}

export default function StatsCard({ label, value, colour, icon, subtitle }: StatsCardProps) {
  return (
    <div className={`relative group p-1 rounded-[1.8rem] bg-white/5 border border-white/5 transition-all duration-500 hover:bg-white/10 overflow-hidden`}>
      <div className={`bg-slate-900/60 backdrop-blur-xl rounded-[1.6rem] p-6 h-full border ${colour} shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]`}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">{label}</p>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-500">
            {icon}
          </div>
        </div>
        <div className="flex flex-col">
            <p className="text-4xl font-black text-white tracking-tighter leading-none">{value}</p>
            {subtitle && <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">{subtitle}</p>}
        </div>
        
        {/* Decorative corner glow */}
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
      </div>
    </div>
  );
}
