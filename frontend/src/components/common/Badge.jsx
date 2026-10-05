import React from 'react';

export const StatusBadge = ({ status }) => {
  const map = {
    NEW: 'bg-[rgba(235,214,195,0.12)] text-[#ecdcc9] border-[rgba(245,230,211,0.22)]',
    CONTACTED: 'bg-[rgba(200,164,126,0.14)] text-[#e8c8a7] border-[rgba(200,164,126,0.25)]',
    QUALIFIED: 'bg-[rgba(168,140,195,0.14)] text-[#ddccee] border-[rgba(168,140,195,0.25)]',
    CONVERTED: 'bg-[rgba(74,157,110,0.14)] text-[#a3e3bd] border-[rgba(74,157,110,0.25)]',
    LOST: 'bg-[rgba(180,45,70,0.15)] text-[#fca5b7] border-[rgba(180,45,70,0.25)]',
  };

  const style = map[status] || 'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.12)]';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase border backdrop-blur-xs ${style}`}>
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const map = {
    URGENT: 'bg-[rgba(220,38,38,0.2)] text-[#fecdd3] border-[rgba(244,63,94,0.35)] font-semibold',
    HIGH: 'bg-[rgba(217,119,6,0.18)] text-[#fed7aa] border-[rgba(245,158,11,0.3)]',
    MEDIUM: 'bg-[rgba(200,164,126,0.15)] text-[#ecdcc9] border-[rgba(200,164,126,0.25)]',
    LOW: 'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.12)]',
  };

  const style = map[priority] || 'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.12)]';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase border backdrop-blur-xs ${style}`}>
      {priority}
    </span>
  );
};

export const SourceBadge = ({ source }) => {
  const map = {
    WEBSITE: 'bg-[rgba(200,164,126,0.12)] text-[#ecdcc9] border-[rgba(200,164,126,0.2)]',
    INSTAGRAM: 'bg-[rgba(195,85,130,0.15)] text-[#f5c6cb] border-[rgba(195,85,130,0.25)]',
    WHATSAPP: 'bg-[rgba(52,148,99,0.14)] text-[#a3e3bd] border-[rgba(52,148,99,0.22)]',
    MANUAL: 'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.12)]',
    OTHER: 'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.12)]',
  };

  const style = map[source] || 'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.12)]';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase border backdrop-blur-xs ${style}`}>
      {source}
    </span>
  );
};

export const AIProviderBadge = ({ provider }) => {
  const isGemini = provider && provider.toLowerCase().includes('gemini');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border backdrop-blur-xs ${
      isGemini 
        ? 'bg-[rgba(200,164,126,0.15)] text-[#f3e7db] border-[rgba(200,164,126,0.3)]' 
        : 'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.12)]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isGemini ? 'bg-[#c8a47e] shadow-[0_0_8px_#c8a47e]' : 'bg-[#baa293]'}`}></span>
      <span>Intelligence: {provider || 'Local Model'}</span>
    </span>
  );
};

export const FollowUpBadge = ({ followUpAt, status }) => {
  if (!followUpAt) {
    return (
      <span className="text-[11px] text-[#8e7a6d] italic font-light">No follow-up set</span>
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(255,255,255,0.05)] text-[#baa293] border border-[rgba(245,230,211,0.1)]">
        <span>{formatted}</span>
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(220,38,38,0.18)] text-[#fca5a5] border border-[rgba(239,68,68,0.3)]">
        <span>Overdue: {formatted}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(200,164,126,0.14)] text-[#edd8c4] border border-[rgba(200,164,126,0.25)]">
      <span>Follow-up: {formatted}</span>
    </span>
  );
};
