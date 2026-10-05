import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';

export function CustomerTopbar() {
  const { user } = useAuth();

  return (
    <header className="px-6 pt-4 pb-2">
      <div className="glass-panel-warm rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-lg border border-[rgba(245,230,211,0.2)]">
        <div>
          <h2 className="font-editorial text-2xl font-normal text-[#faf6f0] tracking-wide">
            Private Client Portal
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[rgba(20,7,12,0.4)] border border-[rgba(245,230,211,0.12)] text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(200,164,126,0.18)] text-[#f3e7db] border border-[rgba(200,164,126,0.3)] text-[10px] uppercase font-semibold tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-[#c8a47e]" />
              Verified Client
            </span>
            <span className="font-medium text-[#ecdcc9]">{user?.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CustomerTopbar;
