import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '../common/Modal';
import api from '../../api/client';

export const Layout = () => {
  const location = useLocation();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    source: 'WEBSITE',
    priority: 'MEDIUM',
    category: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [entryMode, setEntryMode] = useState('text'); // 'text' | 'audio'
  const [audioFile, setAudioFile] = useState(null);

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/customers' || pathname === '/leads') return 'Customer Enquiries';
    if (pathname.startsWith('/customers/') || pathname.startsWith('/leads/')) return 'Customer Enquiry Workspace';
    if (pathname === '/portfolio') return 'Portfolio Assets & Matchmaker';
    if (pathname === '/analytics') return 'Analytics & Reports';
    return 'CustomerAI Hub';
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      if (entryMode === 'audio') {
        if (!audioFile) {
          setCreateError('Please select an audio file or voice note clip.');
          setCreating(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', audioFile);
        if (newLeadForm.name) formData.append('name', newLeadForm.name);
        if (newLeadForm.email) formData.append('email', newLeadForm.email);
        if (newLeadForm.phone) formData.append('phone', newLeadForm.phone);
        formData.append('source', 'WHATSAPP');

        const res = await api.post('/leads/voice-note', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setIsNewLeadOpen(false);
        setAudioFile(null);
        window.dispatchEvent(new CustomEvent('leadCreated', { detail: res.data }));
        window.location.reload();
      } else {
        const res = await api.post('/leads', newLeadForm);
        setIsNewLeadOpen(false);
        setNewLeadForm({
          name: '',
          email: '',
          phone: '',
          message: '',
          source: 'WEBSITE',
          priority: 'MEDIUM',
          category: '',
        });
        window.dispatchEvent(new CustomEvent('leadCreated', { detail: res.data }));
        if (location.pathname === '/customers' || location.pathname === '/leads') {
          window.location.reload();
        }
      }
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create enquiry. Please check input fields.');
    } finally {
      setCreating(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          title={getPageTitle(location.pathname)} 
          onNewLeadClick={() => setIsNewLeadOpen(true)}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* New Enquiry Modal */}
      <Modal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        title="Add Customer Enquiry"
        maxWidth="max-w-lg"
      >
        <div className="flex border-b border-slate-200 mb-4">
          <button
            type="button"
            onClick={() => setEntryMode('text')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              entryMode === 'text'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Standard Text Enquiry
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('audio')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              entryMode === 'audio'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>🎙️ WhatsApp Voice Note Whisperer</span>
          </button>
        </div>

        <form onSubmit={handleCreateLead} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {createError}
            </div>
          )}

          {entryMode === 'audio' ? (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 leading-relaxed">
                <span className="font-bold">🎙️ Voice Note AI Whisperer:</span> Upload an incoming audio message (.mp3, .wav, .m4a, .ogg). AI will transcribe it, extract budget & dates, match your portfolio case studies, and draft a response.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Voice Note Audio Clip *</label>
                <input
                  type="file"
                  required
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus,.webm"
                  onChange={(e) => setAudioFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-300 rounded-lg p-1.5 bg-white"
                />
                {audioFile && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ✓ Selected: {audioFile.name} ({(audioFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="Auto-detected if left blank"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="prospect@example.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Channel</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="WEBSITE">Customer Portal / Web</option>
                    <option value="INSTAGRAM">Instagram DM</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="MANUAL">Direct / Manual</option>
                    <option value="OTHER">Other Channel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Priority</label>
                  <select
                    value={newLeadForm.priority}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Enquiry Message *</label>
                <textarea
                  required
                  rows="4"
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Enter customer message or enquiry details..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </>
          )}


          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">

            <button
              type="button"
              onClick={() => setIsNewLeadOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {creating ? 'Saving...' : 'Create Enquiry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

