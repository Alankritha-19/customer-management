import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Mail, 
  Phone, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Copy, 
  FileEdit, 
  RefreshCw, 
  Bot, 
  Clock, 
  Send, 
  Mic, 
  Volume2, 
  ThumbsUp, 
  Smartphone 
} from 'lucide-react';
import api from '../api/client';
import { StatusBadge, PriorityBadge, SourceBadge, AIProviderBadge, FollowUpBadge } from '../components/common/Badge';

export const LeadDetail = () => {
  const { id } = useParams();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [aiProvider, setAiProvider] = useState('');

  // Follow-up Management states
  const [followUpDate, setFollowUpDate] = useState('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Response Generator states
  const [responseType, setResponseType] = useState('initial'); // 'initial' | 'follow_up'
  const [tone, setTone] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editableResponse, setEditableResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Zero-UI Approver states
  const [pushingApproval, setPushingApproval] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [customEditInput, setCustomEditInput] = useState('');
  const [showSimModal, setShowSimModal] = useState(false);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leads/${id}`);
      setLead(res.data);
      setEditableResponse(res.data.suggested_response || '');
      if (res.data.follow_up_at) {
        const d = new Date(res.data.follow_up_at);
        const pad = (n) => String(n).padStart(2, '0');
        const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setFollowUpDate(localIso);
      } else {
        setFollowUpDate('');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retrieve client dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const handleRunAIAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.post(`/leads/${id}/analyze`);
      setLead(prev => ({
        ...prev,
        category: res.data.category,
        priority: res.data.priority,
        intent: res.data.intent,
        ai_summary: res.data.ai_summary,
        budget: res.data.budget,
        timeline: res.data.timeline,
        requirements: res.data.requirements
      }));
      setAiProvider(res.data.ai_provider);
      setSaveSuccessMsg('AI Lead Analysis completed successfully.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'AI Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateResponse = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api.post(`/leads/${id}/generate-response`, {
        response_type: responseType,
        tone,
        additional_instructions: customInstructions
      });
      setEditableResponse(res.data.suggested_response);
      setLead(prev => ({
        ...prev,
        suggested_response: res.data.suggested_response,
        response_status: res.data.response_status
      }));
      setAiProvider(res.data.ai_provider);
      setSaveSuccessMsg('Bespoke executive response generated.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate AI response.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveFollowUp = async (dateVal) => {
    setSavingFollowUp(true);
    try {
      const payload = {
        follow_up_at: dateVal ? new Date(dateVal).toISOString() : null
      };
      const res = await api.put(`/leads/${id}`, payload);
      setLead(res.data);
      if (res.data.follow_up_at) {
        const d = new Date(res.data.follow_up_at);
        const pad = (n) => String(n).padStart(2, '0');
        const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setFollowUpDate(localIso);
        setSaveSuccessMsg('Consultation touchpoint scheduled.');
      } else {
        setFollowUpDate('');
        setSaveSuccessMsg('Consultation cleared.');
      }
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update consultation schedule.');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const setPresetFollowUp = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(10, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFollowUpDate(localIso);
    handleSaveFollowUp(localIso);
  };

  const handleSaveResponseEdit = async (newResponseStatus = 'EDITED') => {
    setSavingStatus(true);
    try {
      const res = await api.put(`/leads/${id}`, {
        suggested_response: editableResponse,
        response_status: newResponseStatus
      });
      setLead(res.data);
      const actionLabel = newResponseStatus === 'APPROVED' ? 'approved & dispatched to client portal' : 'saved';
      setSaveSuccessMsg(`Response draft ${actionLabel}.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch {
      setError('Failed to update response draft.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await api.put(`/leads/${id}`, { status: newStatus });
      setLead(res.data);
      setSaveSuccessMsg(`Dossier status updated to ${newStatus}.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch {
      setError('Failed to update dossier status.');
    }
  };

  const handleCopyResponse = () => {
    if (!editableResponse) return;
    navigator.clipboard.writeText(editableResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Zero-UI Push Notification to Business Owner
  const handlePushApproval = async () => {
    setPushingApproval(true);
    setError('');
    try {
      const res = await api.post(`/leads/${id}/push-approval`);
      setSaveSuccessMsg(`Dispatch notification sent to ${res.data.recipient} via ${res.data.channel}.`);
      setLead(prev => ({ ...prev, last_notification_sent_at: new Date().toISOString() }));
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch mobile notification.');
    } finally {
      setPushingApproval(false);
    }
  };

  // Zero-UI Simulation (👍 or text edit)
  const handleSimulateWebhookAction = async (actionText) => {
    setSimulatingWebhook(true);
    setError('');
    try {
      const res = await api.post('/webhooks/approval-action', {
        lead_id: parseInt(id),
        action_text: actionText
      });
      if (res.data.success) {
        setLead(prev => ({
          ...prev,
          status: res.data.lead_status,
          response_status: res.data.response_status,
          suggested_response: res.data.final_response
        }));
        setEditableResponse(res.data.final_response);
        setSaveSuccessMsg(`Zero-UI Executed: ${res.data.reply_to_owner}`);
        setShowSimModal(false);
        setCustomEditInput('');
        setTimeout(() => setSaveSuccessMsg(''), 5000);
      } else {
        setError(res.data.reply_to_owner);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulation webhook failed.');
    } finally {
      setSimulatingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 text-center text-[#baa293]">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#c8a47e]" />
        <p className="font-editorial text-base tracking-wide text-[#ecdcc9]">Accessing Client Dossier...</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="p-6 bg-[rgba(180,28,56,0.2)] border border-[rgba(244,63,94,0.3)] rounded-2xl text-[#fca5a5]">
        <h4 className="font-editorial text-lg font-normal">Dossier Access Error</h4>
        <p className="text-xs mt-1 font-light">{error}</p>
        <Link to="/customers" className="mt-4 inline-block text-xs font-semibold text-[#ecdcc9] underline">
          Return to Ledger
        </Link>
      </div>
    );
  }

  const audioApiUrl = lead.audio_url 
    ? (lead.audio_url.startsWith('http') ? lead.audio_url : `http://localhost:8000${lead.audio_url}`)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/customers"
            className="btn-glass-secondary p-2.5 rounded-xl text-[#baa293] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#faf6f0]">{lead.name}</h2>
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              {lead.audio_url && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(200,164,126,0.18)] text-[#f3e7db] border border-[rgba(200,164,126,0.3)] flex items-center gap-1">
                  <Mic className="w-3 h-3 text-[#c8a47e]" /> Voice Intake
                </span>
              )}
            </div>
            <p className="text-xs text-[#a99587] font-light mt-0.5">
              Dossier REF #{String(lead.id).padStart(4, '0')} · Inscribed via {lead.source}
            </p>
          </div>
        </div>

        {/* Status Quick Switcher */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-[#baa293]">State:</span>
          <select
            value={lead.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 rounded-xl glass-input cursor-pointer"
          >
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="LOST">LOST</option>
          </select>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-[rgba(74,157,110,0.18)] border border-[rgba(74,157,110,0.28)] text-[#a3e3bd] rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#a3e3bd] shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Column (5 Cols) vs Right Column (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Voice Note Card (if voice note) */}
          {lead.audio_url && (
            <div className="glass-panel-warm rounded-2xl p-5 border border-[rgba(245,230,211,0.22)] shadow-lg space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#faf6f0] font-editorial text-lg">
                  <Volume2 className="w-4 h-4 text-[#c8a47e]" />
                  <span>Private Audio Memo</span>
                </div>
                <span className="text-[10px] bg-[rgba(200,164,126,0.2)] text-[#ecdcc9] border border-[rgba(200,164,126,0.3)] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Inbound Audio
                </span>
              </div>

              {/* HTML5 Audio Player */}
              <div className="bg-[rgba(15,5,10,0.6)] p-3 rounded-xl border border-[rgba(245,230,211,0.12)]">
                <audio controls className="w-full h-8 opacity-90" src={audioApiUrl}>
                  Audio playback not supported.
                </audio>
              </div>

              {/* Transcription */}
              {lead.transcription && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#baa293] block">
                    Speech-to-Text Transcription
                  </span>
                  <div className="p-3.5 rounded-xl bg-[rgba(15,5,10,0.6)] border border-[rgba(245,230,211,0.1)] text-xs text-[#faf6f0] leading-relaxed italic font-light">
                    "{lead.transcription}"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extracted Project Constraints Card */}
          {(lead.budget || lead.timeline || lead.requirements) && (
            <div className="glass-panel rounded-2xl p-5 border border-[rgba(245,230,211,0.12)] space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-luxury text-[#baa293] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#c8a47e]" />
                  <span>Synthesized Constraints</span>
                </h3>
                <span className="text-[10px] bg-[rgba(245,230,211,0.08)] text-[#f3e7db] border border-[rgba(245,230,211,0.15)] font-medium px-2 py-0.5 rounded">
                  Autonomous Parse
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                {lead.budget && (
                  <div className="p-3 rounded-xl bg-[rgba(200,164,126,0.1)] border border-[rgba(200,164,126,0.2)]">
                    <span className="text-[10px] font-semibold text-[#c8a47e] uppercase tracking-wider block">Estimated Budget</span>
                    <span className="text-sm font-editorial text-[#faf6f0] mt-0.5 block">{lead.budget}</span>
                  </div>
                )}
                {lead.timeline && (
                  <div className="p-3 rounded-xl bg-[rgba(245,230,211,0.06)] border border-[rgba(245,230,211,0.15)]">
                    <span className="text-[10px] font-semibold text-[#baa293] uppercase tracking-wider block">Target Horizon</span>
                    <span className="text-sm font-editorial text-[#faf6f0] mt-0.5 block">{lead.timeline}</span>
                  </div>
                )}
              </div>

              {lead.requirements && (
                <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(245,230,211,0.08)] text-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#baa293] block mb-1">
                    Specific Commission Requirements
                  </span>
                  <p className="text-[#faf6f0] leading-relaxed font-light">{lead.requirements}</p>
                </div>
              )}
            </div>
          )}

          {/* Customer Overview Card */}
          <div className="glass-panel rounded-2xl p-5 border border-[rgba(245,230,211,0.12)] space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-luxury text-[#baa293]">
              Client Identity Dossier
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-[#faf6f0]">
                <Mail className="w-4 h-4 text-[#c8a47e] shrink-0" />
                <span className="font-light select-all">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2.5 text-[#faf6f0]">
                  <Phone className="w-4 h-4 text-[#c8a47e] shrink-0" />
                  <span className="font-light select-all">{lead.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-[#faf6f0]">
                <Tag className="w-4 h-4 text-[#c8a47e] shrink-0" />
                <SourceBadge source={lead.source} />
              </div>
              <div className="flex items-center gap-2.5 text-[#a99587]">
                <Calendar className="w-4 h-4 text-[#baa293] shrink-0" />
                <span>Captured: {new Date(lead.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Original Customer Message Card */}
          <div className="glass-panel rounded-2xl p-5 border border-[rgba(245,230,211,0.12)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-luxury text-[#baa293]">
                Inscribed Message
              </h3>
              <span className="text-[11px] text-[#a99587] font-light">Client transmission</span>
            </div>
            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(245,230,211,0.08)] text-xs text-[#faf6f0] leading-relaxed italic font-light whitespace-pre-wrap">
              "{lead.message}"
            </div>
          </div>

          {/* Follow-up Reminder */}
          <div className="glass-panel rounded-2xl p-5 border border-[rgba(245,230,211,0.12)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[rgba(200,164,126,0.18)] text-[#f3e7db] border border-[rgba(200,164,126,0.3)]">
                  <Clock className="w-4 h-4 text-[#c8a47e]" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg text-[#faf6f0]">Consultation Touchpoint</h3>
                  <p className="text-[11px] text-[#a99587] font-light">Schedule concierge communication</p>
                </div>
              </div>
              <FollowUpBadge followUpAt={lead.follow_up_at} status={lead.status} />
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl glass-input"
                />
                <button
                  onClick={() => handleSaveFollowUp(followUpDate)}
                  disabled={savingFollowUp || !followUpDate}
                  className="btn-glass-primary px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  {savingFollowUp ? 'Scheduling...' : 'Set'}
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-[#baa293] font-light">Presets:</span>
                <button
                  onClick={() => setPresetFollowUp(1)}
                  className="btn-glass-secondary px-2.5 py-1 rounded-lg text-[11px]"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => setPresetFollowUp(3)}
                  className="btn-glass-secondary px-2.5 py-1 rounded-lg text-[11px]"
                >
                  +3 Days
                </button>
                <button
                  onClick={() => setPresetFollowUp(7)}
                  className="btn-glass-secondary px-2.5 py-1 rounded-lg text-[11px]"
                >
                  Next Week
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Hub & Approver Studio */}
        <div className="lg:col-span-7 space-y-6">
          {/* Zero-UI Approver (WhatsApp & Telegram) Banner Card */}
          <div className="glass-panel-elevated rounded-3xl p-6 border border-[rgba(245,230,211,0.18)] shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.35)] to-transparent" />

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[rgba(200,164,126,0.18)] border border-[rgba(245,230,211,0.25)] text-[#faf6f0]">
                  <Smartphone className="w-5 h-5 text-[#c8a47e]" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-normal text-[#faf6f0] flex items-center gap-2">
                    Zero-UI Mobile Approver
                    {lead.response_status === 'APPROVED' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(74,157,110,0.2)] text-[#a3e3bd] border border-[rgba(74,157,110,0.3)] flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Dispatched (👍)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#baa293] font-light mt-0.5">
                    Push draft to principal's device. Reply with 👍 to dispatch or type modifications directly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePushApproval}
                  disabled={pushingApproval}
                  className="btn-glass-accent px-4 py-2 rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${pushingApproval ? 'animate-spin' : ''}`} />
                  <span>{pushingApproval ? 'Transmitting...' : 'Push to Mobile'}</span>
                </button>

                <button
                  onClick={() => setShowSimModal(!showSimModal)}
                  className="btn-glass-secondary px-3.5 py-2 rounded-xl text-xs font-semibold gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-[#c8a47e]" />
                  <span>Simulate 👍</span>
                </button>
              </div>
            </div>

            {/* In-app Simulator Panel */}
            {showSimModal && (
              <div className="p-4 bg-[rgba(20,7,12,0.8)] rounded-2xl border border-[rgba(245,230,211,0.15)] space-y-3 text-xs">
                <div className="flex items-center justify-between text-[#faf6f0] font-medium">
                  <span className="font-editorial text-base">Simulate Inbound Concierge Dispatch</span>
                  <button onClick={() => setShowSimModal(false)} className="text-[#baa293] hover:text-white">✕</button>
                </div>
                <p className="text-[11px] text-[#a99587] font-light">
                  Simulate receiving an inbound message from the business owner to trigger zero-UI instant approval or reply revision:
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateWebhookAction('👍')}
                    disabled={simulatingWebhook}
                    className="flex-1 py-2.5 btn-glass-primary font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <ThumbsUp className="w-4 h-4 text-[#c8a47e]" />
                    Send 👍 (Instant Approve & Transmit to Client)
                  </button>
                </div>

                <div className="pt-2 border-t border-[rgba(245,230,211,0.1)] space-y-2">
                  <label className="text-[11px] text-[#baa293] uppercase tracking-wider font-semibold block">Or Simulate Text Revision:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEditInput}
                      onChange={(e) => setCustomEditInput(e.target.value)}
                      placeholder="e.g. Edit: Dear Vivienne, delighted to present our private $15,000 commission tier."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl glass-input"
                    />
                    <button
                      onClick={() => handleSimulateWebhookAction(customEditInput || 'Edit: Revised reply via mobile')}
                      disabled={simulatingWebhook}
                      className="btn-glass-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                    >
                      Transmit Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Card */}
          <div className="glass-panel rounded-3xl border border-[rgba(245,230,211,0.12)] p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[rgba(200,164,126,0.15)] text-[#f3e7db] border border-[rgba(200,164,126,0.25)]">
                  <Bot className="w-4 h-4 text-[#c8a47e]" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-normal text-[#faf6f0]">AI Client Qualification</h3>
                  <p className="text-[11px] text-[#a99587] font-light">Intent classification & synthesis</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AIProviderBadge provider={aiProvider || (lead.category ? 'Analyzed' : 'Ready')} />
                <button
                  onClick={handleRunAIAnalysis}
                  disabled={analyzing}
                  className="btn-glass-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-[#c8a47e] ${analyzing ? 'animate-spin' : ''}`} />
                  <span>{analyzing ? 'Calibrating...' : lead.category ? 'Re-Analyze' : 'Analyze Dossier'}</span>
                </button>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(245,230,211,0.08)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#baa293]">Category</span>
                <p className="text-xs font-medium text-[#faf6f0] mt-1">
                  {lead.category || <span className="text-[#8e7467] font-light italic">Execute AI analysis</span>}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(245,230,211,0.08)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#baa293]">Client Intent</span>
                <p className="text-xs font-medium text-[#c8a47e] mt-1">
                  {lead.intent || <span className="text-[#8e7467] font-light italic">Execute AI analysis</span>}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(245,230,211,0.08)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#baa293]">Urgency Tier</span>
                <div className="mt-1">
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div>
              <span className="text-[10px] font-semibold text-[#baa293] uppercase tracking-luxury block mb-1.5">
                Executive Synthesis
              </span>
              <div className="p-4 rounded-xl bg-[rgba(200,164,126,0.08)] border border-[rgba(245,230,211,0.12)] text-xs text-[#faf6f0] leading-relaxed font-light">
                {lead.ai_summary ? (
                  lead.ai_summary
                ) : (
                  <span className="text-[#8e7467] italic">
                    Select "Analyze Dossier" to extract client synthesis and automatic intelligence taxonomy.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Response Generator Studio */}
          <div className="glass-panel rounded-3xl border border-[rgba(245,230,211,0.12)] p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-editorial text-2xl font-normal text-[#faf6f0] flex items-center gap-2.5">
                  <span>Suggested Response Studio</span>
                  {lead.response_status && (
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      lead.response_status === 'APPROVED' ? 'bg-[rgba(74,157,110,0.2)] text-[#a3e3bd] border-[rgba(74,157,110,0.3)]' :
                      lead.response_status === 'EDITED' ? 'bg-[rgba(200,164,126,0.2)] text-[#ecdcc9] border-[rgba(200,164,126,0.3)]' :
                      'bg-[rgba(255,255,255,0.06)] text-[#baa293] border-[rgba(245,230,211,0.1)]'
                    }`}>
                      {lead.response_status === 'APPROVED' ? 'APPROVED & VISIBLE TO CLIENT' : lead.response_status}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#a99587] font-light mt-0.5">
                  Autonomous composition tailored to client intent and inquiry context
                </p>
              </div>

              <button
                onClick={handleGenerateResponse}
                disabled={generating}
                className="btn-glass-primary px-4 py-2 rounded-xl text-xs font-semibold gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 text-[#c8a47e] ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Drafting...' : `Generate ${responseType === 'follow_up' ? 'Follow-Up' : 'Response'}`}</span>
              </button>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#baa293] mb-1">Response Type</label>
                <select
                  value={responseType}
                  onChange={(e) => setResponseType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl glass-input"
                >
                  <option value="initial">Initial Inquiry Reply</option>
                  <option value="follow_up">Follow-Up / Concierge Check-in</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#baa293] mb-1">Elegance / Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl glass-input"
                >
                  <option value="professional">Editorial & Refined</option>
                  <option value="friendly">Warm & Gracious</option>
                  <option value="direct">Direct & Decisive</option>
                  <option value="consultative">Private Concierge & Strategic</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#baa293] mb-1">Artistic Directive</label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. emphasize private salon viewing"
                  className="w-full px-3 py-1.5 text-xs rounded-xl glass-input"
                />
              </div>
            </div>

            {/* Editable Response Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#a99587]">
                <span>Draft Workspace (Principal Review)</span>
                <span>{editableResponse.length} characters</span>
              </div>
              <textarea
                rows={8}
                value={editableResponse}
                onChange={(e) => {
                  setEditableResponse(e.target.value);
                  if (lead.response_status === 'APPROVED') {
                    setLead(prev => ({ ...prev, response_status: 'EDITED' }));
                  }
                }}
                placeholder="Select 'Generate Response' to compose bespoke reply..."
                className="w-full p-4 text-xs rounded-2xl glass-input font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Response Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(245,230,211,0.1)]">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleSaveResponseEdit('APPROVED')}
                  disabled={savingStatus || !editableResponse}
                  className="btn-glass-primary px-4 py-2 rounded-xl text-xs font-semibold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c8a47e]" />
                  <span>Approve & Transmit to Client</span>
                </button>

                <button
                  onClick={() => handleSaveResponseEdit('EDITED')}
                  disabled={savingStatus || !editableResponse}
                  className="btn-glass-secondary px-3.5 py-2 rounded-xl text-xs font-medium gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyResponse}
                  disabled={!editableResponse}
                  className="btn-glass-secondary px-3.5 py-2 rounded-xl text-xs font-medium gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Response'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
