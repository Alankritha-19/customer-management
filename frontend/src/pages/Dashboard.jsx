import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight, 
  Inbox, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  Calendar 
} from 'lucide-react';
import api from '../api/client';
import { StatsCard } from '../components/common/StatsCard';
import { StatusBadge, PriorityBadge, SourceBadge, FollowUpBadge } from '../components/common/Badge';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleLeadCreated = () => fetchDashboardData();
    window.addEventListener('leadCreated', handleLeadCreated);
    return () => window.removeEventListener('leadCreated', handleLeadCreated);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading live MySQL metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Error loading metrics</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
        >
          Retry
        </button>
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
    qualification_rate: 0,
    upcoming_follow_ups: 0,
    overdue_follow_ups: 0
  };

  const upcomingList = data?.upcoming_follow_ups_list || [];
  const overdueList = data?.overdue_follow_ups_list || [];
  const hasLeads = kpis.total_leads > 0;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Customers"
          value={kpis.total_leads}
          icon={Users}
          subtext="Captured customer enquiries"
          color="indigo"
        />
        <StatsCard
          title="New Enquiries"
          value={kpis.new_leads}
          icon={Inbox}
          change={`${kpis.new_leads} pending`}
          changeType="neutral"
          subtext="Awaiting owner review & reply"
          color="blue"
        />
        <StatsCard
          title="Upcoming Follow-ups"
          value={kpis.upcoming_follow_ups || 0}
          icon={Clock}
          change={kpis.overdue_follow_ups > 0 ? `${kpis.overdue_follow_ups} overdue` : 'On schedule'}
          changeType={kpis.overdue_follow_ups > 0 ? 'negative' : 'positive'}
          subtext="Scheduled customer touches"
          color="amber"
        />
        <StatsCard
          title="Converted Customers"
          value={kpis.converted_leads}
          icon={CheckCircle}
          change={`${kpis.conversion_rate}% conversion rate`}
          changeType="positive"
          subtext="Successfully converted clients"
          color="emerald"
        />
      </div>

      {/* Follow-up Alerts & Quick Action Cards */}
      {(overdueList.length > 0 || upcomingList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Follow-ups */}
          {overdueList.length > 0 && (
            <div className="bg-rose-50/70 rounded-xl border border-rose-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-900">Overdue Follow-ups</h3>
                    <p className="text-xs text-rose-600">Requires immediate attention</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-200 text-rose-800 rounded-full">
                  {overdueList.length} overdue
                </span>
              </div>
              <div className="space-y-2 mt-3">
                {overdueList.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="p-3 bg-white rounded-lg border border-rose-100 flex items-center justify-between text-xs hover:border-rose-300 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-[11px] text-slate-500">{lead.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
                      <Link
                        to={`/customers/${lead.id}`}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors"
                      >
                        Follow up
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Follow-ups */}
          {upcomingList.length > 0 && (
            <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">Upcoming Follow-ups</h3>
                    <p className="text-xs text-amber-700">Scheduled touchpoints</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-200 text-amber-900 rounded-full">
                  {upcomingList.length} upcoming
                </span>
              </div>
              <div className="space-y-2 mt-3">
                {upcomingList.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="p-3 bg-white rounded-lg border border-amber-100 flex items-center justify-between text-xs hover:border-amber-300 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-[11px] text-slate-500">{lead.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
                      <Link
                        to={`/customers/${lead.id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Visuals & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Enquiry Volume Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Customer Enquiry Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily enquiries captured in MySQL</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Real-time Data</span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
            {data?.trend_7d?.map((item, idx) => {
              const maxCount = Math.max(...data.trend_7d.map(d => d.count), 5);
              const heightPercent = Math.max((item.count / maxCount) * 100, 8);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </div>
                  <div 
                    style={{ height: `${heightPercent}%` }} 
                    className="w-full max-w-[40px] rounded-t-md bg-indigo-600/80 group-hover:bg-indigo-600 transition-all"
                  />
                  <span className="text-[10px] font-semibold text-slate-400 truncate mt-1">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Enquiry Priority Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Urgency and value assessment</p>

            <div className="space-y-3">
              {data?.priority_breakdown?.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-900">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.label === 'URGENT' ? 'bg-rose-500' :
                        item.label === 'HIGH' ? 'bg-orange-500' :
                        item.label === 'MEDIUM' ? 'bg-indigo-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Lost Enquiries:</span>
            <span className="font-bold text-rose-600">{kpis.lost_leads} records</span>
          </div>
        </div>
      </div>

      {/* Recent Enquiries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Enquiries</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest customer enquiries ready for AI qualification & reply</p>
          </div>
          <Link
            to="/customers"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View all enquiries</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!hasLeads ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No customer enquiries captured yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add your first customer enquiry using the button in the top bar, or customers can submit enquiries through the Customer Portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Source</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Priority</th>
                  <th className="py-3 px-6">Follow-up</th>
                  <th className="py-3 px-6">AI Category</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {data.recent_leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-slate-400 text-[11px]">{lead.email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <SourceBadge source={lead.source} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3.5 px-6">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    <td className="py-3.5 px-6">
                      <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-medium text-slate-600">{lead.category || 'Pending AI'}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/customers/${lead.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Workspace</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
