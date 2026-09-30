import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Inbox,
  Clock
} from 'lucide-react';
import api from '../api/client';
import { StatusBadge, PriorityBadge, SourceBadge, FollowUpBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState('');
  
  const [deleteModalLead, setDeleteModalLead] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (followUpFilter) params.follow_up_status = followUpFilter;

      const res = await api.get('/leads', { params });
      setLeads(res.data);
    } catch {
      // quiet handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, priorityFilter, sourceFilter, followUpFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteModalLead) return;
    setDeleting(true);
    try {
      await api.delete(`/leads/${deleteModalLead.id}`);
      setLeads(leads.filter(l => l.id !== deleteModalLead.id));
      setDeleteModalLead(null);
    } catch {
      alert('Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer enquiries by name, email, or message keyword..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          {/* Follow-up Filter */}
          <select
            value={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Follow-ups</option>
            <option value="overdue">Overdue Follow-up</option>
            <option value="upcoming">Upcoming (Next 7d)</option>
            <option value="scheduled">Any Scheduled</option>
            <option value="none">No Follow-up</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Sources</option>
            <option value="WEBSITE">Website / Portal</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="MANUAL">Manual</option>
            <option value="OTHER">Other</option>
          </select>

          <button
            onClick={fetchLeads}
            title="Refresh List"
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && leads.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs font-semibold">Loading customer enquiries from MySQL...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No matching customer enquiries found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              {search || statusFilter || priorityFilter || sourceFilter || followUpFilter
                ? 'Try resetting your search query or filters.'
                : 'No customer enquiries have been received yet. Add an enquiry using the button at the top.'}
            </p>
            {(search || statusFilter || priorityFilter || sourceFilter || followUpFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setSourceFilter('');
                  setFollowUpFilter('');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Source</th>
                  <th className="py-3 px-6">Enquiry Message</th>
                  <th className="py-3 px-6">Priority</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Follow-up</th>
                  <th className="py-3 px-6">AI Category / Intent</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <Link to={`/customers/${lead.id}`} className="group block">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {lead.name}
                        </div>
                        <div className="text-slate-400 text-[11px]">{lead.email}</div>
                        {lead.phone && <div className="text-slate-400 text-[10px]">{lead.phone}</div>}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <SourceBadge source={lead.source} />
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="truncate text-slate-600 font-normal" title={lead.message}>
                        {lead.message}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-xs font-semibold py-1 px-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
                    </td>
                    <td className="py-4 px-6">
                      {lead.category ? (
                        <div>
                          <span className="font-semibold text-slate-800">{lead.category}</span>
                          {lead.intent && (
                            <div className="text-[10px] text-indigo-600 font-medium">
                              {lead.intent}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not analyzed</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/customers/${lead.id}`}
                        title="Open AI Workspace"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Studio</span>
                      </Link>
                      <button
                        onClick={() => setDeleteModalLead(lead)}
                        title="Delete Enquiry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalLead}
        onClose={() => setDeleteModalLead(null)}
        title="Delete Customer Enquiry"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete enquiry from <strong className="text-slate-900">{deleteModalLead?.name}</strong> ({deleteModalLead?.email})? This action will remove all corresponding AI analyses from MySQL.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeleteModalLead(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteLead}
              disabled={deleting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete Enquiry'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
