import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  RefreshCw,
  PieChart,
  Target
} from 'lucide-react';
import api from '../api/client';
import { StatsCard } from '../components/common/StatsCard';

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch {
      // quiet error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-28 text-center text-[#baa293]">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#c8a47e]" />
        <p className="font-editorial text-base tracking-wide text-[#ecdcc9]">Synthesizing Executive Analytics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_leads: 0,
    new_leads: 0,
    qualified_leads: 0,
    converted_leads: 0,
    lost_leads: 0,
    conversion_rate: 0,
    qualification_rate: 0
  };

  return (
    <div className="space-y-7">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#faf6f0]">
            Executive Performance & Conversion Telemetry
          </h2>
          <p className="text-xs text-[#a99587] font-light mt-0.5">
            Real-time pipeline metrics and client conversion telemetry from MySQL
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn-glass-secondary px-3.5 py-2 rounded-xl text-xs font-medium gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#c8a47e]" />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Client Dossiers"
          value={kpis.total_leads}
          icon={Users}
          subtext="Inscribed client inquiries"
        />
        <StatsCard
          title="Qualification Rate"
          value={`${kpis.qualification_rate}%`}
          icon={Target}
          subtext={`${kpis.qualified_leads + kpis.converted_leads} of ${kpis.total_leads} qualified`}
        />
        <StatsCard
          title="Conversion Win Rate"
          value={`${kpis.conversion_rate}%`}
          icon={CheckCircle}
          subtext={`${kpis.converted_leads} confirmed commissions`}
        />
        <StatsCard
          title="Closed Inquiries"
          value={kpis.lost_leads}
          icon={TrendingUp}
          subtext="Archived or non-retained"
        />
      </div>

      {/* 2-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pipeline Funnel with restrained luxury palette */}
        <div className="glass-panel rounded-3xl border border-[rgba(245,230,211,0.12)] p-6 space-y-4">
          <h3 className="font-editorial text-xl font-normal text-[#faf6f0] flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4 text-[#c8a47e]" />
            <span>Inquiry Status Distribution</span>
          </h3>

          <div className="space-y-4 pt-2">
            {data?.status_breakdown?.map((item) => {
              // Restrained palette: ivory, champagne, muted beige, burgundy, subtle warm accent
              const barColor = 
                item.label === 'CONVERTED' ? 'bg-[#faf6f0]' :
                item.label === 'QUALIFIED' ? 'bg-[#ecdcc9]' :
                item.label === 'CONTACTED' ? 'bg-[#baa293]' :
                item.label === 'NEW' ? 'bg-[#c8a47e]' : 'bg-[#7a192c]';

              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#ecdcc9] font-medium">{item.label}</span>
                    <span className="text-[#faf6f0] font-sans-ui">{item.count} <span className="text-[#a99587] font-light">({item.percentage}%)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Acquisition Channels with monochromatic luxury gradient */}
        <div className="glass-panel rounded-3xl border border-[rgba(245,230,211,0.12)] p-6 space-y-4">
          <h3 className="font-editorial text-xl font-normal text-[#faf6f0] flex items-center gap-2.5">
            <PieChart className="w-4 h-4 text-[#c8a47e]" />
            <span>Channel Acquisition Breakdown</span>
          </h3>

          <div className="space-y-4 pt-2">
            {data?.source_breakdown?.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#ecdcc9] font-medium">{item.label}</span>
                  <span className="text-[#faf6f0] font-sans-ui">{item.count} <span className="text-[#a99587] font-light">({item.percentage}%)</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[rgba(200,164,126,0.6)] to-[rgba(245,230,211,0.85)]"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="glass-panel rounded-3xl border border-[rgba(245,230,211,0.12)] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-editorial text-xl font-normal text-[#faf6f0]">Daily Inscription Trajectory</h3>
            <p className="text-xs text-[#a99587] mt-0.5 font-light">Captured client inquiries over rolling 7 days</p>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-[rgba(245,230,211,0.08)]">
          {data?.trend_7d?.map((item, idx) => {
            const maxCount = Math.max(...data.trend_7d.map(d => d.count), 5);
            const heightPercent = Math.max((item.count / maxCount) * 100, 8);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[11px] font-semibold text-[#f3e7db] opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </div>
                <div 
                  style={{ height: `${heightPercent}%` }} 
                  className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[rgba(142,116,103,0.35)] to-[rgba(235,214,195,0.75)] group-hover:to-[#faf6f0] border-t border-[rgba(255,255,255,0.35)] transition-all"
                />
                <span className="text-[10px] font-sans-ui text-[#baa293] mt-1.5">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
