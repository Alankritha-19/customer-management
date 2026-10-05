import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  RefreshCw, 
  Search, 
  ShieldCheck,
  Mic,
  Sparkles,
  FileText
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';

export function CustomerPortal() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submissionMode, setSubmissionMode] = useState('text'); // 'text' | 'audio'
  const [customerAudioFile, setCustomerAudioFile] = useState(null);
  const [formData, setFormData] = useState({
    owner_id: '',
    message: '',
    service_interest: '',
    budget: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [enquiriesRes, ownersRes] = await Promise.all([
        api.get('/customer/enquiries'),
        api.get('/auth/owners')
      ]);
      setEnquiries(enquiriesRes.data || []);
      setOwners(ownersRes.data || []);
      if (ownersRes.data && ownersRes.data.length > 0 && !formData.owner_id) {
        setFormData(prev => ({ ...prev, owner_id: ownersRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
      setError('Unable to synchronize private inquiries. Please verify network access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (submissionMode === 'audio') {
        if (!customerAudioFile) {
          setError('Please provide an audio memo file.');
          setSubmitting(false);
          return;
        }
        const data = new FormData();
        data.append('file', customerAudioFile);
        if (formData.owner_id) {
          data.append('owner_id', formData.owner_id);
        }

        const res = await api.post('/customer/enquiries/voice-note', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setEnquiries(prev => [res.data, ...prev]);
        setSuccessMsg('Your voice memo has been received. Our executive concierge team has been dispatched.');
        setCustomerAudioFile(null);
        setShowModal(false);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        if (!formData.message.trim()) {
          setError('Please transcribe your inquiry requirements.');
          setSubmitting(false);
          return;
        }

        const payload = {
          owner_id: formData.owner_id ? parseInt(formData.owner_id) : null,
          message: formData.message,
          service_interest: formData.service_interest || null,
          budget: formData.budget || null,
          notes: formData.notes || null
        };

        const res = await api.post('/customer/enquiries', payload);
        setEnquiries(prev => [res.data, ...prev]);
        setSuccessMsg('Inquiry inscribed successfully. Your private concierge is preparing an executive reply.');
        setFormData({
          owner_id: owners[0]?.id || '',
          message: '',
          service_interest: '',
          budget: '',
          notes: ''
        });
        setShowModal(false);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.detail || 'Failed to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEnquiries = enquiries.filter(item => {
    const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus;
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.message && item.message.toLowerCase().includes(query)) ||
      (item.service_interest && item.service_interest.toLowerCase().includes(query)) ||
      (item.approved_response && item.approved_response.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Luxury Hero Banner */}
      <div className="glass-panel-warm rounded-3xl p-8 border border-[rgba(245,230,211,0.22)] shadow-2xl relative overflow-hidden">
        {/* Subtle inner top glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.4)] to-transparent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(200,164,126,0.18)] border border-[rgba(245,230,211,0.25)] text-[#f3e7db] text-[10px] font-sans-ui uppercase tracking-luxury mb-3">
              <Sparkles className="w-3 h-3 text-[#c8a47e]" />
              Exclusive Client Suite
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-[#faf6f0] tracking-wide">
              Welcome, {user?.name || 'Esteemed Client'}
            </h1>
            <p className="text-xs sm:text-sm text-[#baa293] font-light mt-1.5 max-w-xl leading-relaxed">
              Submit bespoke commissions, monitor curation status, and access verified executive responses.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-glass-primary px-5 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider text-[#faf6f0] gap-2 shadow-xl shrink-0"
          >
            <Plus className="w-4 h-4 text-[#c8a47e]" />
            <span>Inscribe New Inquiry</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[rgba(180,28,56,0.2)] border border-[rgba(244,63,94,0.3)] text-xs text-[#fca5a5] flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[rgba(74,157,110,0.2)] border border-[rgba(74,157,110,0.3)] text-xs text-[#a3e3bd] flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-[rgba(245,230,211,0.12)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#baa293]" />
          <input
            type="text"
            placeholder="Search inquiries or concierge replies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input"
          />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl glass-input"
          >
            <option value="ALL">All Inquiries</option>
            <option value="NEW">Submitted</option>
            <option value="CONTACTED">Concierge Replied</option>
            <option value="QUALIFIED">In Curation</option>
            <option value="CLOSED">Completed</option>
          </select>
          <button
            onClick={fetchData}
            title="Refresh Inquiries"
            className="btn-glass-secondary p-2 rounded-xl text-[#baa293] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inquiry List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#baa293]">
          <RefreshCw className="w-8 h-8 text-[#c8a47e] animate-spin mb-3" />
          <p className="font-editorial text-sm tracking-wide">Retrieving client record...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl p-8 border border-[rgba(245,230,211,0.12)]">
          <MessageSquare className="w-12 h-12 text-[#8e7467] mx-auto mb-3 opacity-60" />
          <h3 className="font-editorial text-xl font-normal text-[#faf6f0]">No Inquiries Recorded</h3>
          <p className="text-xs text-[#a99587] mt-1.5 max-w-md mx-auto leading-relaxed">
            {searchTerm || filterStatus !== 'ALL' 
              ? "No recorded inquiries meet your specified criteria."
              : "Your dossier is currently pristine. Select 'Inscribe New Inquiry' to connect with our executive team."}
          </p>
          {!searchTerm && filterStatus === 'ALL' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 btn-glass-primary px-5 py-2.5 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-2 text-[#c8a47e]" />
              Inscribe First Inquiry
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredEnquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              className="glass-card rounded-2xl p-6 border border-[rgba(245,230,211,0.14)] hover:border-[rgba(245,230,211,0.3)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-sans-ui uppercase tracking-luxury text-[#a99587]">
                      REF #{String(enquiry.id).padStart(4, '0')}
                    </span>
                    {enquiry.service_interest && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[rgba(245,230,211,0.08)] text-[#f3e7db] border border-[rgba(245,230,211,0.15)]">
                        {enquiry.service_interest}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={enquiry.status} />
                </div>

                <div className="font-editorial text-base sm:text-lg text-[#faf6f0] leading-snug line-clamp-3 mb-4 italic font-normal">
                  "{enquiry.message}"
                </div>

                {/* Voice Note Audio */}
                {enquiry.audio_url && (
                  <div className="mb-4 p-3 bg-[rgba(20,7,12,0.6)] border border-[rgba(245,230,211,0.14)] rounded-xl">
                    <div className="text-[10px] font-semibold text-[#c8a47e] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Private Voice Recording</span>
                    </div>
                    <audio
                      controls
                      className="w-full h-8 opacity-90"
                      src={enquiry.audio_url.startsWith('http') ? enquiry.audio_url : `http://localhost:8000${enquiry.audio_url}`}
                    />
                  </div>
                )}

                {/* Approved Response Card */}
                {enquiry.approved_response ? (
                  <div className="bg-[rgba(200,164,126,0.1)] border border-[rgba(245,230,211,0.22)] rounded-2xl p-4 mb-3 relative overflow-hidden">
                    <div className="flex items-center text-xs font-semibold text-[#f3e7db] mb-2 tracking-wide">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-[#c8a47e]" />
                      Official Executive Concierge Response
                    </div>
                    <p className="text-xs text-[#e5d8cc] leading-relaxed whitespace-pre-line font-light">
                      {enquiry.approved_response}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(245,230,211,0.08)] rounded-xl p-3.5 mb-3 text-xs text-[#baa293] flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-2 text-[#c8a47e] shrink-0" />
                    <span>Our executive team is reviewing your brief. A formal response will be issued shortly.</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[rgba(245,230,211,0.08)] flex items-center justify-between text-[11px] text-[#a99587]">
                <span>Inscribed {new Date(enquiry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {enquiry.budget && (
                  <span className="font-medium text-[#faf6f0]">
                    Allocation: {enquiry.budget}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Client Enquiry */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060103]/80 backdrop-blur-md">
          <div className="glass-panel-elevated rounded-3xl border border-[rgba(245,230,211,0.2)] shadow-2xl w-full max-w-lg overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.35)] to-transparent" />

            <div className="p-6 border-b border-[rgba(245,230,211,0.12)] flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl font-normal text-[#faf6f0]">Inscribe Client Brief</h3>
                <p className="text-xs text-[#baa293] mt-0.5 font-light">Direct communication with the executive desk</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[#baa293] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="flex p-1.5 mx-6 mt-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(245,230,211,0.1)]">
              <button
                type="button"
                onClick={() => setSubmissionMode('text')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  submissionMode === 'text'
                    ? 'bg-[rgba(245,230,211,0.18)] text-[#faf6f0] border border-[rgba(245,230,211,0.25)] shadow-xs font-semibold'
                    : 'text-[#baa293] hover:text-[#faf6f0]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Written Brief</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMode('audio')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  submissionMode === 'audio'
                    ? 'bg-[rgba(245,230,211,0.18)] text-[#faf6f0] border border-[rgba(245,230,211,0.25)] shadow-xs font-semibold'
                    : 'text-[#baa293] hover:text-[#faf6f0]'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-[#c8a47e]" />
                <span>Voice Note Memo</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {owners.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
                    Designated Principal / Office
                  </label>
                  <select
                    name="owner_id"
                    value={formData.owner_id}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                  >
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.company || o.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {submissionMode === 'audio' ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-[rgba(200,164,126,0.08)] border border-[rgba(245,230,211,0.15)] rounded-xl text-xs text-[#edd8c4] leading-relaxed">
                    <span className="font-semibold text-[#faf6f0]">🎙️ Voice Memo Upload:</span> Attach an audio file (.mp3, .wav, .m4a). Our autonomous intelligence will transcribe your voice requirements and prepare an executive reply.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
                      Audio Memo File *
                    </label>
                    <input
                      type="file"
                      required
                      accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus,.webm"
                      onChange={(e) => setCustomerAudioFile(e.target.files[0] || null)}
                      className="w-full text-xs text-[#baa293] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[rgba(245,230,211,0.15)] file:text-[#faf6f0] hover:file:bg-[rgba(245,230,211,0.25)] cursor-pointer border border-[rgba(245,230,211,0.15)] rounded-xl p-2 bg-[rgba(15,5,10,0.6)]"
                    />
                    {customerAudioFile && (
                      <p className="text-[11px] text-[#a3e3bd] font-medium mt-1.5">
                        ✓ Loaded: {customerAudioFile.name} ({(customerAudioFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
                      Artisan / Service Interest
                    </label>
                    <input
                      type="text"
                      name="service_interest"
                      placeholder="e.g. Bespoke Creative Direction, Private Commission"
                      value={formData.service_interest}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
                      Project Allocation / Budget (Optional)
                    </label>
                    <input
                      type="text"
                      name="budget"
                      placeholder="e.g. $10,000 – $25,000"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#baa293] mb-1.5">
                      Detailed Memorandum *
                    </label>
                    <textarea
                      rows={4}
                      required
                      name="message"
                      placeholder="Transcribe your vision, deadlines, and key requirements..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input resize-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[rgba(245,230,211,0.1)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-glass-secondary px-4 py-2 text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-glass-primary px-5 py-2 text-xs font-semibold rounded-xl"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Inscribing...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-2 text-[#c8a47e]" />
                      Transmit Inquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPortal;
