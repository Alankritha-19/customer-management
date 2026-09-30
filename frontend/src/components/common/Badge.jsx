import React from 'react';

export const StatusBadge = ({ status }) => {
  const map = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    CONTACTED: 'bg-amber-50 text-amber-700 border-amber-200',
    QUALIFIED: 'bg-purple-50 text-purple-700 border-purple-200',
    CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    LOST: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const style = map[status] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const map = {
    URGENT: 'bg-red-100 text-red-800 border-red-300 font-bold',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const style = map[priority] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {priority}
    </span>
  );
};

export const SourceBadge = ({ source }) => {
  const map = {
    WEBSITE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    INSTAGRAM: 'bg-pink-50 text-pink-700 border-pink-200',
    WHATSAPP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MANUAL: 'bg-slate-50 text-slate-700 border-slate-200',
    OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const style = map[source] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {source}
    </span>
  );
};

export const AIProviderBadge = ({ provider }) => {
  const isGemini = provider && provider.toLowerCase().includes('gemini');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
      isGemini 
        ? 'bg-purple-50 text-purple-700 border-purple-200' 
        : 'bg-slate-100 text-slate-700 border-slate-200'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isGemini ? 'bg-purple-600 animate-pulse' : 'bg-slate-400'}`}></span>
      AI Provider: {provider || 'Local Analysis'}
    </span>
  );
};

export const FollowUpBadge = ({ followUpAt, status }) => {
  if (!followUpAt) {
    return (
      <span className="text-[11px] text-slate-400 italic">No follow-up</span>
    );
  }

  const isClosed = status === 'CONVERTED' || status === 'LOST';
  const followDate = new Date(followUpAt);
  const now = new Date();
  const isOverdue = !isClosed && followDate < now;

  const formatted = followDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (isClosed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span>{formatted}</span>
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
        <span>Overdue: {formatted}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
      <span>Follow-up: {formatted}</span>
    </span>
  );
};
