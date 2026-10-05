import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Inbox
} from 'lucide-react';
import api from '../api/client';
import { PriorityBadge, SourceBadge, FollowUpBadge } from '../components/common/Badge';
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
      alert('Failed to delete inquiry');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-[rgba(245,230,211,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#baa293] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dossier ledger by client name, email, or message keyword..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl glass-input"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input"
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
            className="px-3 py-2 text-xs rounded-xl glass-input"
          >
            <option value="">All Consultations</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming (7d)</option>
            <option value="scheduled">Scheduled</option>
            <option value="none">None Scheduled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High Priority</option>
            <option value="URGENT">Immediate</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input"
          >
            <option value="">All Channels</option>
            <option value="WEBSITE">Private Portal</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="MANUAL">Concierge</option>
            <option value="OTHER">Other Channels</option>
          </select>

          <button
            onClick={fetchLeads}
            title="Refresh Ledger"
            className="btn-glass-secondary p-2 rounded-xl text-[#baa293] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="glass-panel rounded-3xl border border-[rgba(245,230,211,0.12)] shadow-2xl overflow-hidden">
        {loading && leads.length === 0 ? (
          <div className="py-24 text-center text-[#baa293]">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#c8a47e]" />
            <p className="font-editorial text-sm tracking-wide text-[#ecdcc9]">Synchronizing dossier ledger...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Inbox className="w-12 h-12 text-[#8e7467] mx-auto mb-3 opacity-60" />
            <h4 className="font-editorial text-xl font-normal text-[#faf6f0]">No inquiries match criteria</h4>
            <p className="text-xs text-[#a99587] max-w-sm mx-auto mt-1 mb-5 font-light">
              {search || statusFilter || priorityFilter || sourceFilter || followUpFilter
                ? 'Adjust your search parameters or reset ledger filters.'
                : 'No client inquiries recorded yet.'}
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
                className="btn-glass-secondary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Reset Ledger Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[rgba(245,230,211,0.04)] border-b border-[rgba(245,230,211,0.08)] text-[10px] font-sans-ui text-[#baa293] uppercase tracking-luxury">
                  <th className="py-4 px-6">Client Identity</th>
                  <th className="py-4 px-6">Channel</th>
                  <th className="py-4 px-6">Bespoke Inquiry</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Consultation</th>
                  <th className="py-4 px-6">AI Curation</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(245,230,211,0.06)] text-xs">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[rgba(245,230,211,0.03)] transition-colors">
                    <td className="py-4 px-6">
                      <Link to={`/customers/${lead.id}`} className="group block">
                        <div className="font-medium text-[#faf6f0] group-hover:text-[#ecdcc9] transition-colors">
                          {lead.name}
                        </div>
                        <div className="text-[#a99587] text-[11px] font-light">{lead.email}</div>
                        {lead.phone && <div className="text-[#a99587] text-[10px] font-light">{lead.phone}</div>}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <SourceBadge source={lead.source} />
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="truncate text-[#ecdcc9] font-light italic" title={lead.message}>
                        "{lead.message}"
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <PriorityBadge priority={lead.priority} />
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-[11px] font-medium py-1 px-2.5 rounded-lg glass-input cursor-pointer"
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
                          <span className="font-medium text-[#faf6f0]">{lead.category}</span>
                          {lead.intent && (
                            <div className="text-[10px] text-[#c8a47e] font-sans-ui font-light">
                              {lead.intent}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#8e7467] italic font-light">Pending Analysis</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/customers/${lead.id}`}
                        title="Open AI Studio"
                        className="btn-glass-primary px-3 py-1.5 rounded-xl text-xs font-medium gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[#c8a47e]" />
                        <span>AI Studio</span>
                      </Link>
                      <button
                        onClick={() => setDeleteModalLead(lead)}
                        title="Delete Dossier"
                        className="btn-glass-danger p-1.5 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        title="Expunge Client Record"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#baa293] leading-relaxed font-light">
            Are you certain you wish to expunge the dossier for <strong className="text-[#faf6f0] font-medium">{deleteModalLead?.name}</strong> ({deleteModalLead?.email})? This action will permanently remove all associated intelligence records.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(245,230,211,0.1)]">
            <button
              onClick={() => setDeleteModalLead(null)}
              className="btn-glass-secondary px-4 py-2 text-xs font-medium rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteLead}
              disabled={deleting}
              className="btn-glass-danger px-4 py-2 text-xs font-semibold rounded-xl"
            >
              {deleting ? 'Expunging...' : 'Expunge Record'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
