import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '../common/Modal';
import api from '../../api/client';
import { Mic, FileText } from 'lucide-react';

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
    if (pathname === '/') return 'Executive Intelligence';
    if (pathname === '/customers' || pathname === '/leads') return 'Private Client Inquiries';
    if (pathname.startsWith('/customers/') || pathname.startsWith('/leads/')) return 'Client Dossier & AI Studio';
    if (pathname === '/analytics') return 'Performance & Conversion Telemetry';
    return 'Aurelia Command';
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      if (entryMode === 'audio') {
        if (!audioFile) {
          setCreateError('Please upload an audio voice note file.');
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
      setCreateError(err.response?.data?.detail || 'Failed to register enquiry. Please check input fields.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen text-[#f5ede6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          title={getPageTitle(location.pathname)} 
          onNewLeadClick={() => setIsNewLeadOpen(true)}
        />
        <main className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto pb-12">
            <Outlet />
          </div>
        </main>
      </div>

      {/* New Enquiry Modal */}
      <Modal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        title="Record Client Enquiry"
        maxWidth="max-w-xl"
      >
        <div className="flex p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(245,230,211,0.1)] mb-5">
          <button
            type="button"
            onClick={() => setEntryMode('text')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              entryMode === 'text'
                ? 'bg-[rgba(245,230,211,0.18)] text-[#faf6f0] border border-[rgba(245,230,211,0.25)] shadow-xs font-semibold'
                : 'text-[#baa293] hover:text-[#faf6f0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Standard Inscription</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('audio')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              entryMode === 'audio'
                ? 'bg-[rgba(245,230,211,0.18)] text-[#faf6f0] border border-[rgba(245,230,211,0.25)] shadow-xs font-semibold'
                : 'text-[#baa293] hover:text-[#faf6f0]'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#c8a47e]" />
            <span>Voice Note Intake</span>
          </button>
        </div>

        <form onSubmit={handleCreateLead} className="space-y-4">
          {createError && (
            <div className="p-3.5 rounded-xl bg-[rgba(180,28,56,0.2)] border border-[rgba(244,63,94,0.3)] text-xs text-[#fca5a5]">
              {createError}
            </div>
          )}

          {entryMode === 'audio' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-[rgba(200,164,126,0.08)] border border-[rgba(245,230,211,0.15)] rounded-xl text-xs text-[#edd8c4] leading-relaxed">
                <span className="font-semibold text-[#faf6f0]">🎙️ Private Audio Intake:</span> Upload an incoming voice memo (.mp3, .wav, .m4a). The AI will transcribe the audio, detect client intent & budget, and compose a bespoke draft.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
                  Voice Note Audio Clip *
                </label>
                <input
                  type="file"
                  required
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus,.webm"
                  onChange={(e) => setAudioFile(e.target.files[0] || null)}
                  className="w-full text-xs text-[#baa293] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[rgba(245,230,211,0.15)] file:text-[#faf6f0] hover:file:bg-[rgba(245,230,211,0.25)] cursor-pointer border border-[rgba(245,230,211,0.15)] rounded-xl p-2 bg-[rgba(15,5,10,0.6)]"
                />
                {audioFile && (
                  <p className="text-[11px] text-[#a3e3bd] font-medium mt-1.5 flex items-center gap-1">
                    <span>✓ Loaded:</span> {audioFile.name} ({(audioFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Client Name (Optional)</label>
                  <input
                    type="text"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="Auto-inferred if blank"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Client Email (Optional)</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="client@prestige.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="e.g. Lady Vivienne Vance"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Client Email *</label>
                  <input
                    type="email"
                    required
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="vivienne@atelier.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Telephone</label>
                  <input
                    type="text"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Channel</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  >
                    <option value="WEBSITE">Private Portal / Web</option>
                    <option value="INSTAGRAM">Instagram Direct</option>
                    <option value="WHATSAPP">WhatsApp Business</option>
                    <option value="MANUAL">Direct Concierge</option>
                    <option value="OTHER">Other Private Referrals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Priority</label>
                  <select
                    value={newLeadForm.priority}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Immediate / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">Client Message & Requirements *</label>
                <textarea
                  required
                  rows="4"
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Detail the client's bespoke inquiry or creative brief..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input resize-none"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(245,230,211,0.1)]">
            <button
              type="button"
              onClick={() => setIsNewLeadOpen(false)}
              className="btn-glass-secondary px-4 py-2.5 text-xs font-medium rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-glass-primary px-5 py-2.5 text-xs font-semibold rounded-xl"
            >
              {creating ? 'Inscribing...' : 'Record Enquiry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
