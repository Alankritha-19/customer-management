import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, change, changeType = 'positive', subtext }) => {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
      {/* Subtle top inner light line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.25)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#baa293] font-sans-ui">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-[rgba(245,230,211,0.06)] border border-[rgba(245,230,211,0.12)] text-[#e2c7a7] shadow-inner transition-transform group-hover:scale-105">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline gap-2.5">
        <span className="font-editorial text-3xl md:text-4xl font-normal tracking-tight text-[#faf6f0]">
          {value}
        </span>
        {change !== undefined && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
            changeType === 'positive' 
              ? 'text-[#a3e3bd] bg-[rgba(74,157,110,0.15)] border-[rgba(74,157,110,0.25)]' 
              : changeType === 'negative' 
              ? 'text-[#fca5a5] bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.25)]' 
              : 'text-[#e5d8cc] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]'
          }`}>
            {change}
          </span>
        )}
      </div>

      {subtext && <p className="mt-2 text-xs text-[#a18c7e] font-light leading-relaxed">{subtext}</p>}
    </div>
  );
};
