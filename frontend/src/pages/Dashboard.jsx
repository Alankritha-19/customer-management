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
      setError(err.response?.data?.detail || 'Failed to synchronize executive dashboard.');
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
      <div className="flex flex-col items-center justify-center py-28 text-[#baa293]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#c8a47e] mb-3" />
        <p className="font-editorial text-base tracking-wide text-[#ecdcc9]">Calibrating Executive Intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-[rgba(180,28,56,0.2)] border border-[rgba(244,63,94,0.3)] text-[#fca5a5] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-editorial text-lg font-normal">Disruption in Telemetry</h4>
            <p className="text-xs mt-0.5 font-light">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-glass-danger px-4 py-2 rounded-xl text-xs font-semibold"
        >
          Re-establish Sync
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
    <div className="space-y-7">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Client Dossiers"
          value={kpis.total_leads}
          icon={Users}
          subtext="Captured bespoke inquiries"
        />
        <StatsCard
          title="Pending Review"
          value={kpis.new_leads}
          icon={Inbox}
          change={`${kpis.new_leads} awaiting`}
          changeType="neutral"
          subtext="Unprocessed client messages"
        />
        <StatsCard
          title="Scheduled Touchpoints"
          value={kpis.upcoming_follow_ups || 0}
          icon={Clock}
          change={kpis.overdue_follow_ups > 0 ? `${kpis.overdue_follow_ups} critical` : 'Punctual'}
          changeType={kpis.overdue_follow_ups > 0 ? 'negative' : 'positive'}
          subtext="Curated consultations scheduled"
        />
        <StatsCard
          title="Converted Retainers"
          value={kpis.converted_leads}
          icon={CheckCircle}
          change={`${kpis.conversion_rate}% conversion rate`}
          changeType="positive"
          subtext="Signed client commissions"
        />
      </div>

      {/* Follow-up Alerts & Quick Action Cards */}
      {(overdueList.length > 0 || upcomingList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Overdue Follow-ups */}
          {overdueList.length > 0 && (
            <div className="glass-panel rounded-2xl border border-[rgba(244,63,94,0.25)] p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[rgba(220,38,38,0.2)] text-[#fca5a5] border border-[rgba(244,63,94,0.3)]">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg text-[#faf6f0] font-normal leading-tight">Critical Follow-ups</h3>
                    <p className="text-[11px] text-[#fca5a5] font-light">Requires immediate concierge attention</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold bg-[rgba(220,38,38,0.2)] text-[#fca5a5] border border-[rgba(244,63,94,0.3)] rounded-full uppercase tracking-wider">
                  {overdueList.length} Overdue
                </span>
              </div>
              <div className="space-y-2 mt-3">
                {overdueList.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="p-3 bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(244,63,94,0.15)] flex items-center justify-between text-xs hover:border-[rgba(244,63,94,0.3)] transition-colors">
                    <div>
                      <div className="font-medium text-[#faf6f0]">{lead.name}</div>
                      <div className="text-[11px] text-[#a99587] font-light">{lead.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
                      <Link
                        to={`/customers/${lead.id}`}
                        className="btn-glass-danger px-3 py-1 rounded-lg font-semibold text-[11px]"
                      >
                        Engage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Follow-ups */}
          {upcomingList.length > 0 && (
            <div className="glass-panel rounded-2xl border border-[rgba(200,164,126,0.22)] p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[rgba(200,164,126,0.18)] text-[#f3e7db] border border-[rgba(200,164,126,0.3)]">
                    <Calendar className="w-4 h-4 text-[#c8a47e]" />
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg text-[#faf6f0] font-normal leading-tight">Upcoming Consultations</h3>
                    <p className="text-[11px] text-[#baa293] font-light">Scheduled touchpoints across dossier</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold bg-[rgba(200,164,126,0.15)] text-[#ecdcc9] border border-[rgba(200,164,126,0.25)] rounded-full uppercase tracking-wider">
                  {upcomingList.length} Scheduled
                </span>
              </div>
              <div className="space-y-2 mt-3">
                {upcomingList.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="p-3 bg-[rgba(255,255,255,0.03)] rounded-xl border border-[rgba(245,230,211,0.08)] flex items-center justify-between text-xs hover:border-[rgba(245,230,211,0.2)] transition-colors">
                    <div>
                      <div className="font-medium text-[#faf6f0]">{lead.name}</div>
                      <div className="text-[11px] text-[#a99587] font-light">{lead.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
                      <Link
                        to={`/customers/${lead.id}`}
                        className="btn-glass-secondary px-3 py-1 rounded-lg font-medium text-[11px]"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Visuals & Restrained Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Enquiry Volume Trend with restrained champagne & wine palette */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-[rgba(245,230,211,0.12)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-editorial text-xl font-normal text-[#faf6f0]">7-Day Inscription Trajectory</h3>
              <p className="text-xs text-[#a99587] mt-0.5 font-light">Real-time client volume aggregated in MySQL</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#c8a47e] font-medium px-2.5 py-1 rounded-lg bg-[rgba(200,164,126,0.1)] border border-[rgba(200,164,126,0.2)]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Telemetry Active</span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-3 border-b border-[rgba(245,230,211,0.08)]">
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
                    className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-[rgba(142,116,103,0.35)] to-[rgba(235,214,195,0.7)] group-hover:to-[#faf6f0] border-t border-[rgba(255,255,255,0.4)] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                  />
                  <span className="text-[10px] font-sans-ui text-[#baa293] truncate mt-1.5">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Urgency Breakdown with luxury warm palette */}
        <div className="glass-panel rounded-2xl p-6 border border-[rgba(245,230,211,0.12)] flex flex-col justify-between">
          <div>
            <h3 className="font-editorial text-xl font-normal text-[#faf6f0] mb-1">Dossier Priority Distribution</h3>
            <p className="text-xs text-[#a99587] font-light mb-5">Urgency & bespoke resource allocation</p>

            <div className="space-y-3.5">
              {data?.priority_breakdown?.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#ecdcc9] font-medium">{item.label}</span>
                    <span className="text-[#faf6f0] font-sans-ui">{item.count} <span className="text-[#a99587] font-light">({item.percentage}%)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.label === 'URGENT' ? 'bg-[#e05263]' :
                        item.label === 'HIGH' ? 'bg-[#e5a86d]' :
                        item.label === 'MEDIUM' ? 'bg-[#c8a47e]' : 'bg-[#8e7467]'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-[rgba(245,230,211,0.08)] flex items-center justify-between text-xs">
            <span className="text-[#baa293] font-light">Inactive Inquiries:</span>
            <span className="font-medium text-[#fca5a5]">{kpis.lost_leads} records</span>
          </div>
        </div>
      </div>

      {/* Recent Enquiries Table */}
      <div className="glass-panel rounded-3xl border border-[rgba(245,230,211,0.12)] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(245,230,211,0.1)] flex items-center justify-between bg-[rgba(255,255,255,0.01)]">
          <div>
            <h3 className="font-editorial text-2xl font-normal text-[#faf6f0]">Recent Client Inquiries</h3>
            <p className="text-xs text-[#a99587] mt-0.5 font-light">Latest inquiries ready for AI dossier qualification & draft approval</p>
          </div>
          <Link
            to="/customers"
            className="btn-glass-secondary px-3.5 py-1.5 rounded-xl text-xs font-medium gap-1.5"
          >
            <span>Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#c8a47e]" />
          </Link>
        </div>

        {!hasLeads ? (
          <div className="py-20 px-4 text-center">
            <Inbox className="w-12 h-12 text-[#8e7467] mx-auto mb-3 opacity-60" />
            <h4 className="font-editorial text-xl font-normal text-[#faf6f0]">No inquiries inscribed yet</h4>
            <p className="text-xs text-[#a99587] max-w-sm mx-auto mt-1 mb-4 leading-relaxed font-light">
              Add your first customer inquiry using the top action bar or receive inquiries directly via the Private Client Portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[rgba(245,230,211,0.04)] border-b border-[rgba(245,230,211,0.08)] text-[10px] font-sans-ui text-[#baa293] uppercase tracking-luxury">
                  <th className="py-3.5 px-6">Client Identity</th>
                  <th className="py-3.5 px-6">Origin</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Consultation</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6 text-right">Studio Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,230,211,0.06)] text-xs">
                {data.recent_leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[rgba(245,230,211,0.03)] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#faf6f0]">{lead.name}</div>
                      <div className="text-[#a99587] text-[11px] font-light">{lead.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <SourceBadge source={lead.source} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-4 px-6">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    <td className="py-4 px-6">
                      <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-light text-[#ecdcc9]">{lead.category || 'Pending Intelligence'}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/customers/${lead.id}`}
                        className="btn-glass-primary px-3 py-1.5 rounded-xl text-xs font-medium gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[#c8a47e]" />
                        <span>AI Studio</span>
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
