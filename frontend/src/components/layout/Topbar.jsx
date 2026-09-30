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
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>MySQL 8</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className={`flex items-center gap-1.5 font-semibold ${isGemini ? 'text-indigo-600' : 'text-slate-600'}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI: {isGemini ? 'Gemini 1.5' : 'Local Fallback'}</span>
          </span>
        </div>

        {/* Quick New Customer Enquiry Button */}
        {onNewLeadClick && (
          <button
            onClick={onNewLeadClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Enquiry</span>
          </button>
        )}
      </div>
    </header>
  );
};
