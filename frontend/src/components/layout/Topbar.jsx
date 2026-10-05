import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Database } from 'lucide-react';
import api from '../../api/client';

export const Topbar = ({ title, onNewLeadClick }) => {
  const [health, setHealth] = useState({ ai_provider: 'local_fallback', database: 'connected' });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch {
        // quiet error
      }
    };
    fetchHealth();
  }, []);

  const isGemini = health.ai_provider === 'gemini';

  return (
    <header className="px-6 pt-4 pb-2">
      <div className="glass-panel-warm rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-lg border border-[rgba(245,230,211,0.2)]">
        <div className="flex items-center gap-3">
          <h2 className="font-editorial text-2xl font-normal text-[#faf6f0] tracking-wide">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Live System Indicator */}
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[rgba(20,7,12,0.4)] border border-[rgba(245,230,211,0.12)] text-xs text-[#baa293]">
            <span className="flex items-center gap-1.5 font-medium text-[#ecdcc9]">
              <Database className="w-3.5 h-3.5 text-[#c8a47e]" />
              <span>MySQL 8 Core</span>
            </span>
            <span className="text-[rgba(245,230,211,0.2)]">|</span>
            <span className="flex items-center gap-1.5 font-medium text-[#ecdcc9]">
              <Sparkles className="w-3.5 h-3.5 text-[#c8a47e]" />
              <span>AI: {isGemini ? 'Gemini 1.5 Pro' : 'Neural Fallback'}</span>
            </span>
          </div>

          {/* Quick New Customer Enquiry Button */}
          {onNewLeadClick && (
            <button
              onClick={onNewLeadClick}
              className="btn-glass-primary px-4 py-2 rounded-xl text-xs font-semibold tracking-wide gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#c8a47e]" />
              <span>Record Client Enquiry</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
