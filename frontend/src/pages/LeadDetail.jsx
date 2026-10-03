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
  Smartphone,
  ExternalLink,
  Briefcase
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
      setError(err.response?.data?.detail || 'Failed to load lead details.');
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
      setSaveSuccessMsg('AI Lead Analysis completed successfully!');
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
        additional_instructions: customInstructions,
        include_portfolio_match: true
      });
      setEditableResponse(res.data.suggested_response);
      setLead(prev => ({
        ...prev,
        suggested_response: res.data.suggested_response,
        response_status: res.data.response_status,
        matched_portfolio_title: res.data.matched_portfolio_title,
        matched_portfolio_url: res.data.matched_portfolio_url
      }));
      setAiProvider(res.data.ai_provider);
      setSaveSuccessMsg(`AI response generated with matching portfolio assets!`);
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
        setSaveSuccessMsg('Follow-up scheduled successfully!');
      } else {
        setFollowUpDate('');
        setSaveSuccessMsg('Follow-up cleared.');
      }
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update follow-up date.');
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
      const actionLabel = newResponseStatus === 'APPROVED' ? 'approved & ready to dispatch' : 'saved';
      setSaveSuccessMsg(`Response draft ${actionLabel}!`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch {
      setError('Failed to save response.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await api.put(`/leads/${id}`, { status: newStatus });
      setLead(res.data);
      setSaveSuccessMsg(`Lead status moved to ${newStatus}`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch {
      setError('Failed to update lead status.');
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
      setSaveSuccessMsg(`Approval notification sent to ${res.data.recipient} via ${res.data.channel}!`);
      setLead(prev => ({ ...prev, last_notification_sent_at: new Date().toISOString() }));
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch approval notification.');
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
        setSaveSuccessMsg(`Zero-UI Action Executed: ${res.data.reply_to_owner}`);
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
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Loading Lead Workspace...</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
        <h4 className="font-bold text-sm">Error</h4>
        <p className="text-xs mt-1">{error}</p>
        <Link to="/customers" className="mt-4 inline-block text-xs font-semibold text-rose-800 underline">
          Back to Customer Enquiries
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
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              {lead.audio_url && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Mic className="w-3 h-3" /> Voice Note
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer Enquiry #{lead.id} · Received via {lead.source}
            </p>
          </div>
        </div>

        {/* Status Quick Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={lead.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Column (5 Cols) vs Right Column (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* FEATURE 1: WhatsApp Voice Note Card (if voice note) */}
          {lead.audio_url && (
            <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/40 rounded-xl border border-purple-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>WhatsApp Voice Note Whisperer</span>
                </div>
                <span className="text-[10px] bg-purple-200/60 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                  Audio Inbound
                </span>
              </div>

              {/* HTML5 Audio Player */}
              <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-xs">
                <audio controls className="w-full h-8" src={audioApiUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>

              {/* Transcription */}
              {lead.transcription && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-purple-900 block">AI Speech-to-Text Transcription:</span>
                  <div className="p-3 rounded-lg bg-white border border-purple-100 text-xs text-slate-700 leading-relaxed font-mono">
                    "{lead.transcription}"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FEATURE 1: Extracted Project Constraints Card */}
          {(lead.budget || lead.timeline || lead.requirements) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI-Extracted Project Constraints</span>
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded">
                  Whisper Parsed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                {lead.budget && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Extracted Budget</span>
                    <span className="text-xs font-bold text-emerald-900 mt-0.5 block">{lead.budget}</span>
                  </div>
                )}
                {lead.timeline && (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Target Timeline / Date</span>
                    <span className="text-xs font-bold text-amber-900 mt-0.5 block">{lead.timeline}</span>
                  </div>
                )}
              </div>

              {lead.requirements && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Scope & Requirements</span>
                  <p className="text-slate-700 leading-relaxed">{lead.requirements}</p>
                </div>
              )}
            </div>
          )}

          {/* Customer Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium select-all">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium select-all">{lead.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-slate-700">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <SourceBadge source={lead.source} />
              </div>
              <div className="flex items-center gap-2.5 text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Captured: {new Date(lead.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Original Customer Message Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Message
              </h3>
              <span className="text-[11px] text-slate-400">Inbound message</span>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
              {lead.message}
            </div>
          </div>

          {/* Follow-up Reminder */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Follow-Up Reminder
                  </h3>
                  <p className="text-[11px] text-slate-400">Schedule customer touches</p>
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
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <button
                  onClick={() => handleSaveFollowUp(followUpDate)}
                  disabled={savingFollowUp || !followUpDate}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingFollowUp ? 'Saving...' : 'Set'}
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-medium text-slate-400">Presets:</span>
                <button
                  onClick={() => setPresetFollowUp(1)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => setPresetFollowUp(3)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  onClick={() => setPresetFollowUp(7)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                >
                  Next Week
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Hub & Approver Studio */}
        <div className="lg:col-span-7 space-y-6">
          {/* FEATURE 3: Zero-UI Approver (WhatsApp & Telegram) Banner Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/60 border border-indigo-400/30 text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    Zero-UI WhatsApp & Telegram Approver
                    {lead.response_status === 'APPROVED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Approved (👍)
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Push draft to owner's phone. Approve with 👍 or edit text directly via webhook without opening dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePushApproval}
                  disabled={pushingApproval}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${pushingApproval ? 'animate-spin' : ''}`} />
                  <span>{pushingApproval ? 'Pushing...' : 'Push to Mobile'}</span>
                </button>

                <button
                  onClick={() => setShowSimModal(!showSimModal)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulate 👍 / Edit</span>
                </button>
              </div>
            </div>

            {/* In-app Simulator Panel */}
            {showSimModal && (
              <div className="p-4 bg-slate-800/90 rounded-lg border border-slate-700 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>📱 Simulate Inbound Owner WhatsApp/Telegram Response</span>
                  <button onClick={() => setShowSimModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulate receiving an inbound message from the business owner to trigger zero-UI instant approval or reply revision:
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateWebhookAction('👍')}
                    disabled={simulatingWebhook}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Send 👍 (Instant Approve & Dispatch)
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-700/80 space-y-2">
                  <label className="text-[11px] text-slate-300 font-semibold block">Or Simulate Custom Text Edit:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEditInput}
                      onChange={(e) => setCustomEditInput(e.target.value)}
                      placeholder="e.g. Edit: Hi Sarah, here is our special $4,500 package."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSimulateWebhookAction(customEditInput || 'Edit: Revised reply via mobile')}
                      disabled={simulatingWebhook}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                    >
                      Send Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FEATURE 2: Instant Portfolio Matchmaker Card */}
          {(lead.matched_portfolio_title || lead.matched_portfolio_url) && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Instant Portfolio Matchmaker (Auto-Attached)</span>
                </div>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Keyword Matched
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Matched Case Study: <span className="font-bold text-slate-900">{lead.matched_portfolio_title}</span>
              </p>
              <a
                href={lead.matched_portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
              >
                <span>{lead.matched_portfolio_url}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[11px] text-slate-500 italic">
                ✓ This case study link was automatically appended to the suggested reply below.
              </p>
            </div>
          )}

          {/* AI Analysis Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Enquiry Qualification</h3>
                  <p className="text-[11px] text-slate-400">Intent classification & synthesis</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AIProviderBadge provider={aiProvider || (lead.category ? 'Analyzed' : 'Ready')} />
                <button
                  onClick={handleRunAIAnalysis}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                  <span>{analyzing ? 'Analyzing...' : lead.category ? 'Re-Analyze' : 'Analyze Lead'}</span>
                </button>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Identified Category</span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {lead.category || <span className="text-slate-400 font-normal italic">Run AI analysis</span>}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Intent</span>
                <p className="text-xs font-bold text-indigo-700 mt-1">
                  {lead.intent || <span className="text-slate-400 font-normal italic">Run AI analysis</span>}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Urgency Level</span>
                <div className="mt-1">
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Executive Summary
              </span>
              <div className="p-3.5 rounded-lg bg-indigo-50/40 border border-indigo-100/80 text-xs text-slate-700 leading-relaxed">
                {lead.ai_summary ? (
                  lead.ai_summary
                ) : (
                  <span className="text-slate-400 italic">
                    Click "Analyze Lead" to generate an AI summary and automatic lead classification.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Response Generator Studio */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Suggested Response Generator</span>
                  {lead.response_status && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      lead.response_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' :
                      lead.response_status === 'EDITED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {lead.response_status === 'APPROVED' ? 'APPROVED & DISPATCHED' : lead.response_status}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  AI automatically inserts matching portfolio case studies based on project inquiry keywords
                </p>
              </div>

              <button
                onClick={handleGenerateResponse}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Drafting...' : `Generate ${responseType === 'follow_up' ? 'Follow-Up' : 'Response'}`}</span>
              </button>
            </div>

            {/* Controls: Response Type, Tone & Custom Instruction */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Response Type</label>
                <select
                  value={responseType}
                  onChange={(e) => setResponseType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="initial">Initial Inquiry Reply</option>
                  <option value="follow_up">Follow-Up / Check-in</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Communication Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="professional">Professional & Polished</option>
                  <option value="friendly">Friendly & Warm</option>
                  <option value="direct">Direct & Concise</option>
                  <option value="consultative">Consultative & Strategic</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Custom Guidance (Optional)</label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. emphasize weekend availability"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Editable Response Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Draft Workspace (Owner Review)</span>
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
                placeholder="Click 'Generate Response' to create an AI draft with matched portfolio links..."
                className="w-full p-3.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed text-slate-800 bg-slate-50/50"
              />
            </div>

            {/* Response Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveResponseEdit('APPROVED')}
                  disabled={savingStatus || !editableResponse}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Dispatch</span>
                </button>

                <button
                  onClick={() => handleSaveResponseEdit('EDITED')}
                  disabled={savingStatus || !editableResponse}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyResponse}
                  disabled={!editableResponse}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
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
