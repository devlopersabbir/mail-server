import React, { useState, useRef } from 'react';
import { sendEmail } from '../services/api';
import { EmailMessage } from '../types';
import { RecipientSelector } from './RecipientSelector';
import { EditorToolbar } from './EditorToolbar';
import { VisualCanvas } from './VisualCanvas';
import { GmailInboxPreview } from './GmailInboxPreview';
import { Send, FileText, CheckCircle2, AlertCircle, Eye, Code, Zap, Clock, Globe } from 'lucide-react';

export const EmailComposer: React.FC = () => {
  const [recipientsInput, setRecipientsInput] = useState<string>('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [htmlBody, setHtmlBody] = useState<string>('');
  const [replyTo, setReplyTo] = useState<string>('');
  const [trackingBaseUrl, setTrackingBaseUrl] = useState<string>(
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8080` : 'http://localhost:8080'
  );

  const [activeBodyTab, setActiveBodyTab] = useState<'editor' | 'code' | 'preview'>('editor');
  const [isSync, setIsSync] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [statusResult, setStatusResult] = useState<{ type: 'success' | 'error'; message: string; jobId?: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, val);
      setHtmlBody(editorRef.current.innerHTML);
      setBody(editorRef.current.innerText);
    }
  };

  const insertSnippet = (snippetHtml: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, snippetHtml);
      setHtmlBody(editorRef.current.innerHTML);
      setBody(editorRef.current.innerText);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedEmails.length === 0) {
      setStatusResult({ type: 'error', message: 'Please add at least one recipient email address.' });
      return;
    }

    setSending(true);
    setStatusResult(null);

    const finalHtml = htmlBody || (body ? `<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #202124;">${body.replace(/\n/g, '<br/>')}</div>` : '');

    const payload: EmailMessage = {
      to: parsedEmails,
      subject,
      body: body || htmlBody.replace(/<[^>]*>/g, ''),
      html_body: finalHtml,
      reply_to: replyTo,
      tracking_base_url: trackingBaseUrl,
    };

    try {
      const res = await sendEmail(payload, isSync);
      setStatusResult({
        type: 'success',
        message: res.message || 'Email campaign dispatched successfully',
        jobId: res.data?.job_id,
      });
    } catch (err: any) {
      setStatusResult({ type: 'error', message: err.message || 'Email dispatch failed' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-indigo-400" />
            Campaign Dispatcher Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual WYSIWYG Email Document Editor with Automatic 1x1 Pixel Open Tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setIsSync(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${!isSync ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Zap className="h-3.5 w-3.5" /> Async Queue
          </button>
          <button
            type="button"
            onClick={() => setIsSync(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${isSync ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clock className="h-3.5 w-3.5" /> Sync Instant
          </button>
        </div>
      </div>

      {statusResult && (
        <div className={`p-4 rounded-xl mb-6 border text-sm flex items-center justify-between ${statusResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          <div className="flex items-center gap-3">
            {statusResult.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> : <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />}
            <span>{statusResult.message}</span>
          </div>
          {statusResult.jobId && <span className="text-xs font-mono px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-indigo-400">Job ID: {statusResult.jobId}</span>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <RecipientSelector
          recipientsInput={recipientsInput}
          setRecipientsInput={setRecipientsInput}
          parsedEmails={parsedEmails}
          setParsedEmails={setParsedEmails}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Subject Line</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Special Offer inside" required className="w-full glass-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Reply-To (Optional)</label>
            <input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="support@domain.com" className="w-full glass-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Tracking Base URL / Domain
            </label>
            <input
              type="text"
              value={trackingBaseUrl}
              onChange={(e) => setTrackingBaseUrl(e.target.value)}
              placeholder="e.g. https://mail.mydomain.com or public IP"
              required
              className="w-full glass-input font-mono text-xs text-indigo-300"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-slate-800 mb-3 pb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Message Content</label>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button type="button" onClick={() => setActiveBodyTab('editor')} className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${activeBodyTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                <FileText className="h-3.5 w-3.5" /> Visual Canvas
              </button>
              <button type="button" onClick={() => setActiveBodyTab('code')} className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${activeBodyTab === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                <Code className="h-3.5 w-3.5" /> Raw Source
              </button>
              <button type="button" onClick={() => setActiveBodyTab('preview')} className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${activeBodyTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                <Eye className="h-3.5 w-3.5" /> Recipient Inbox View
              </button>
            </div>
          </div>

          {activeBodyTab === 'editor' && <EditorToolbar execCmd={execCmd} insertSnippet={insertSnippet} />}

          {activeBodyTab === 'editor' && (
            <VisualCanvas
              htmlBody={htmlBody}
              body={body}
              setHtmlBody={setHtmlBody}
              setBody={setBody}
              activeTab={activeBodyTab}
              editorRef={editorRef}
            />
          )}

          {activeBodyTab === 'code' && (
            <textarea
              rows={10}
              value={htmlBody || (body ? `<div style="font-family: Arial, sans-serif; font-size: 15px; color: #202124; line-height: 1.6;">${body.replace(/\n/g, '<br/>')}</div>` : '')}
              onChange={(e) => {
                setHtmlBody(e.target.value);
                setBody(e.target.value.replace(/<[^>]*>/g, ''));
              }}
              placeholder="Raw HTML code view..."
              className="w-full glass-input font-mono text-xs text-amber-200"
            />
          )}

          {activeBodyTab === 'preview' && (
            <GmailInboxPreview subject={subject} htmlBody={htmlBody} body={body} />
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button type="submit" disabled={sending} className="glass-button bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/25 px-8 py-3">
            {sending ? 'Processing Dispatch...' : <><Send className="h-4 w-4" /> Dispatch to {parsedEmails.length} Recipient{parsedEmails.length !== 1 ? 's' : ''}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
