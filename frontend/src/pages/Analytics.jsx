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
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Aggregating MySQL Analytics...</p>
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Intelligence & Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline metrics and customer conversion data from MySQL
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Customers & Inquiries"
          value={kpis.total_leads}
          icon={Users}
          color="indigo"
        />
        <StatsCard
          title="Qualification Rate"
          value={`${kpis.qualification_rate}%`}
          icon={Target}
          subtext={`${kpis.qualified_leads + kpis.converted_leads} of ${kpis.total_leads} qualified`}
          color="purple"
        />
        <StatsCard
          title="Conversion Win Rate"
          value={`${kpis.conversion_rate}%`}
          icon={CheckCircle}
          subtext={`${kpis.converted_leads} converted clients`}
          color="emerald"
        />
        <StatsCard
          title="Lost Inquiries"
          value={kpis.lost_leads}
          icon={TrendingUp}
          subtext="Unqualified or closed enquiries"
          color="rose"
        />
      </div>

      {/* 2-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pipeline Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Enquiry Status Distribution</span>
          </h3>

          <div className="space-y-4 pt-2">
            {data?.status_breakdown?.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="text-slate-900">{item.count} enquiries ({item.percentage}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.label === 'CONVERTED' ? 'bg-emerald-500' :
                      item.label === 'QUALIFIED' ? 'bg-purple-500' :
                      item.label === 'CONTACTED' ? 'bg-amber-500' :
                      item.label === 'NEW' ? 'bg-blue-500' : 'bg-rose-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Acquisition Channels */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Customer Acquisition Channels</span>
          </h3>

          <div className="space-y-4 pt-2">
            {data?.source_breakdown?.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="text-slate-900">{item.count} enquiries ({item.percentage}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Customer Enquiry Volume</h3>
            <p className="text-xs text-slate-400 mt-0.5">Captured enquiries across last 7 calendar days</p>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
          {data?.trend_7d?.map((item, idx) => {
            const maxCount = Math.max(...data.trend_7d.map(d => d.count), 5);
            const heightPercent = Math.max((item.count / maxCount) * 100, 8);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[11px] font-bold text-indigo-600">
                  {item.count}
                </div>
                <div 
                  style={{ height: `${heightPercent}%` }} 
                  className="w-full max-w-[48px] rounded-t-md bg-indigo-600 group-hover:bg-indigo-700 transition-all"
                />
                <span className="text-[11px] font-semibold text-slate-500 mt-1">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

