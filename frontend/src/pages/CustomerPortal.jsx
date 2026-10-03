import { useState, useEffect } from 'react';
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
  Mic
} from 'lucide-react';

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
      setError('Failed to load enquiries or business directory.');
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
          setError('Please select an audio file or record a voice note.');
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
        setSuccessMsg('Voice note enquiry received! AI has processed your audio and notified our business team.');
        setCustomerAudioFile(null);
        setShowModal(false);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        if (!formData.message.trim()) {
          setError('Please enter your enquiry message.');
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
        setSuccessMsg('Enquiry submitted successfully! We will review and respond soon.');
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
      setError(err.response?.data?.detail || 'Failed to submit enquiry.');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"><Clock className="w-3 h-3 mr-1" /> Submitted</span>;
      case 'CONTACTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"><MessageSquare className="w-3 h-3 mr-1" /> Responded</span>;
      case 'QUALIFIED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle2 className="w-3 h-3 mr-1" /> In Progress</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Resolved</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Customer'}!</h1>
            <p className="text-blue-100 text-sm mt-1">
              Submit enquiries, track processing status, and review business responses.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm rounded-xl shadow transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Submit New Enquiry
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search enquiries or replies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">Submitted</option>
            <option value="CONTACTED">Responded</option>
            <option value="QUALIFIED">In Progress</option>
            <option value="CLOSED">Resolved</option>
          </select>
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No Enquiries Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchTerm || filterStatus !== 'ALL' 
              ? "No enquiries match your current filters."
              : "You have not submitted any enquiries yet. Click 'Submit New Enquiry' to reach out to our team."}
          </p>
          {!searchTerm && filterStatus === 'ALL' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Your First Enquiry
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEnquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Enquiry #{enquiry.id}
                    </span>
                    {enquiry.service_interest && (
                      <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                        {enquiry.service_interest}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(enquiry.status)}
                </div>

                <div className="text-slate-800 dark:text-slate-200 text-sm font-medium line-clamp-3 mb-4">
                  "{enquiry.message}"
                </div>

                {enquiry.audio_url && (
                  <div className="mb-3 p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg">
                    <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase flex items-center gap-1 mb-1">
                      <Mic className="w-3 h-3" /> Voice Note Audio
                    </div>
                    <audio
                      controls
                      className="w-full h-8"
                      src={enquiry.audio_url.startsWith('http') ? enquiry.audio_url : `http://localhost:8000${enquiry.audio_url}`}
                    />
                  </div>
                )}


                {enquiry.approved_response ? (
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-3.5 mb-3">
                    <div className="flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5">
                      <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600 dark:text-emerald-400" />
                      Official Response from Business
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {enquiry.approved_response}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 mb-3 text-xs text-slate-500 dark:text-slate-400 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                    Our business team is reviewing your enquiry. An official response will appear here once approved.
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Submitted {new Date(enquiry.created_at).toLocaleDateString()}</span>
                {enquiry.budget && (
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Budget: {enquiry.budget}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit New Enquiry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reach out directly to our business team</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-semibold"
              >
                &times;
              </button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubmissionMode('text')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  submissionMode === 'text'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                Typed Message
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMode('audio')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  submissionMode === 'audio'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>🎙️ Voice Note Clip</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {owners.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Select Business / Department
                  </label>
                  <select
                    name="owner_id"
                    value={formData.owner_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
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
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-lg text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
                    <span className="font-bold">🎙️ Voice Note Upload:</span> Upload an audio recording (.mp3, .wav, .m4a, .ogg) explaining what you need. AI will transcribe your message and extract your dates & requirements automatically!
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Audio Voice File *
                    </label>
                    <input
                      type="file"
                      required
                      accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus,.webm"
                      onChange={(e) => setCustomerAudioFile(e.target.files[0] || null)}
                      className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-slate-800"
                    />
                    {customerAudioFile && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        ✓ Selected: {customerAudioFile.name} ({(customerAudioFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Service / Product of Interest
                    </label>
                    <input
                      type="text"
                      name="service_interest"
                      placeholder="e.g. Enterprise Solution, Consultation"
                      value={formData.service_interest}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Estimated Budget (Optional)
                    </label>
                    <input
                      type="text"
                      name="budget"
                      placeholder="e.g. $1,000 - $5,000"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Enquiry Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      name="message"
                      placeholder="Describe your requirements or questions..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}


              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow transition-colors"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Enquiry
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
