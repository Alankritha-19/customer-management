import React, { useState } from 'react';
import { 
  Webhook, 
  Copy, 
  Check, 
  Send, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Code2
} from 'lucide-react';
import api from '../api/client';

export const Webhooks = () => {
  const [copied, setCopied] = useState(false);
  const [simForm, setSimForm] = useState({
    name: 'Emily Carter',
    email: 'emily@creativestudio.io',
    phone: '+1 555-0199',
    message: 'We urgently need a full redesign of our agency web app and CRM integration. Our budget is around $15,000. Can you send pricing and schedule a call this week?',
    source: 'WEBSITE'
  });
  const [sending, setSending] = useState(false);
  const [responseLog, setResponseLog] = useState(null);
  const [errorLog, setErrorLog] = useState('');

  const webhookUrl = `${window.location.protocol}//${window.location.hostname}:8000/webhooks/lead`;

  const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Emily Carter",
    "email": "emily@creativestudio.io",
    "phone": "+1 555-0199",
    "message": "We need a full redesign of our agency web app and CRM integration.",
    "source": "WEBSITE"
  }'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestWebhook = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrorLog('');
    setResponseLog(null);
    try {
      const res = await api.post('/webhooks/lead', simForm);
      setResponseLog(res.data);
    } catch (err) {
      setErrorLog(err.response?.data?.detail || 'Webhook test request failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Webhook Integration & API</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect external lead forms (Webflow, Typeform, Elementor, Zapier) directly into MySQL and AI processing
        </p>
      </div>

      {/* Webhook Endpoint Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inbound Webhook Endpoint</h3>
              <p className="text-[11px] text-slate-400">Public HTTP POST endpoint for lead ingestion</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active & Ready
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 text-slate-200 flex items-center justify-between font-mono text-xs overflow-x-auto">
          <span className="select-all text-indigo-300 font-semibold">POST {webhookUrl}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-slate-400 hover:text-white ml-3 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* 2-Column: Left = cURL Docs, Right = Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Snippet (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>cURL Request Example</span>
            </h3>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 text-indigo-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {curlSnippet}
          </pre>

          <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
            <div className="font-semibold text-slate-700">Supported JSON Payload Fields:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li><code className="text-slate-700 font-semibold">name</code> (String, required)</li>
              <li><code className="text-slate-700 font-semibold">email</code> (Valid Email, required)</li>
              <li><code className="text-slate-700 font-semibold">message</code> (String, required)</li>
              <li><code className="text-slate-700 font-semibold">phone</code> (String, optional)</li>
              <li><code className="text-slate-700 font-semibold">source</code> (WEBSITE / INSTAGRAM / WHATSAPP / MANUAL / OTHER)</li>
            </ul>
          </div>
        </div>

        {/* Right: Live Interactive Webhook Simulator (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Interactive Webhook Simulator</span>
            </h3>
            <span className="text-[11px] text-slate-400">Test lead capture directly</span>
          </div>

          <form onSubmit={handleTestWebhook} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prospect Name</label>
                <input
                  type="text"
                  required
                  value={simForm.name}
                  onChange={(e) => setSimForm({ ...simForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prospect Email</label>
                <input
                  type="email"
                  required
                  value={simForm.email}
                  onChange={(e) => setSimForm({ ...simForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={simForm.phone}
                  onChange={(e) => setSimForm({ ...simForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Source Channel</label>
                <select
                  value={simForm.source}
                  onChange={(e) => setSimForm({ ...simForm, source: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="WEBSITE">WEBSITE</option>
                  <option value="INSTAGRAM">INSTAGRAM</option>
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="MANUAL">MANUAL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Message</label>
              <textarea
                rows={3}
                required
                value={simForm.message}
                onChange={(e) => setSimForm({ ...simForm, message: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Dispatching Webhook...' : 'Fire Test Webhook'}</span>
            </button>
          </form>

          {/* Test Response Output */}
          {errorLog && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorLog}</span>
            </div>
          )}

          {responseLog && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>201 Created — Stored in MySQL with AI Qualification</span>
              </div>
              <pre className="p-2 rounded bg-white border border-emerald-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-36">
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
