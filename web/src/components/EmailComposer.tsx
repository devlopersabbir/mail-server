import React, { useState, useRef } from 'react';
import { sendEmail } from '../services/api';
import { EmailMessage } from '../types';
import { Send, Upload, FileText, CheckCircle2, AlertCircle, Eye, Code, Zap, Clock } from 'lucide-react';

export const EmailComposer: React.FC = () => {
  const [recipientsInput, setRecipientsInput] = useState<string>('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [htmlBody, setHtmlBody] = useState<string>('');
  const [replyTo, setReplyTo] = useState<string>('');

  const [activeBodyTab, setActiveBodyTab] = useState<'text' | 'html' | 'preview'>('text');
  const [isSync, setIsSync] = useState<boolean>(false); // default: async queue
  const [sending, setSending] = useState<boolean>(false);
  const [statusResult, setStatusResult] = useState<{ type: 'success' | 'error'; message: string; jobId?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseEmails = (text: string) => {
    const rawEmails = text.split(/[\n,;]+/).map((e) => e.trim()).filter((e) => e.length > 0 && e.includes('@'));
    const uniqueEmails = Array.from(new Set(rawEmails));
    setParsedEmails(uniqueEmails);
  };

  const handleRecipientsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRecipientsInput(val);
    parseEmails(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRecipientsInput(content);
        parseEmails(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedEmails.length === 0) {
      setStatusResult({ type: 'error', message: 'Please add at least one recipient email address.' });
      return;
    }

    setSending(true);
    setStatusResult(null);

    const payload: EmailMessage = {
      to: parsedEmails,
      subject,
      body,
      html_body: htmlBody,
      reply_to: replyTo,
    };

    try {
      const res = await sendEmail(payload, isSync);
      const jobId = res.data?.job_id;
      setStatusResult({
        type: 'success',
        message: res.message || 'Email dispatch enqueued successfully',
        jobId,
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
            Campaign Dispatcher
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch bulk email campaigns asynchronously via worker queue or direct synchronous send.
          </p>
        </div>

        {/* Send Mode Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setIsSync(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              !isSync ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Async Queue (High-Scale)
          </button>
          <button
            type="button"
            onClick={() => setIsSync(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              isSync ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Sync Instant
          </button>
        </div>
      </div>

      {statusResult && (
        <div
          className={`p-4 rounded-xl mb-6 border text-sm flex items-center justify-between ${
            statusResult.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {statusResult.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            )}
            <span>{statusResult.message}</span>
          </div>
          {statusResult.jobId && (
            <span className="text-xs font-mono px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-indigo-400">
              Job ID: {statusResult.jobId}
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Recipients ({parsedEmails.length} valid detected)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload CSV / Text File
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </div>

          <textarea
            rows={4}
            value={recipientsInput}
            onChange={handleRecipientsChange}
            placeholder="Paste comma or newline separated email addresses (e.g. user1@test.com, user2@test.com)..."
            className="w-full glass-input font-mono text-xs"
            required
          />
        </div>

        {/* Subject & Reply-To */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Welcome to our platform!"
              required
              className="w-full glass-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Reply-To (Optional)</label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="support@yourdomain.com"
              className="w-full glass-input"
            />
          </div>
        </div>

        {/* Body Editor Tabs */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 mb-3 pb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Message Content</label>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveBodyTab('text')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                  activeBodyTab === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Plain Text
              </button>
              <button
                type="button"
                onClick={() => setActiveBodyTab('html')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                  activeBodyTab === 'html' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" /> HTML Code
              </button>
              <button
                type="button"
                onClick={() => setActiveBodyTab('preview')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                  activeBodyTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> HTML Preview
              </button>
            </div>
          </div>

          {activeBodyTab === 'text' && (
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write plain text email body here..."
              className="w-full glass-input"
            />
          )}

          {activeBodyTab === 'html' && (
            <textarea
              rows={6}
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder="<h1>Hello</h1><p>Write HTML code here...</p>"
              className="w-full glass-input font-mono text-xs text-amber-200"
            />
          )}

          {activeBodyTab === 'preview' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 min-h-[160px]">
              {htmlBody ? (
                <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: htmlBody }} />
              ) : (
                <p className="text-slate-500 text-xs italic">No HTML content provided yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={sending}
            className="glass-button bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/25 px-8 py-3"
          >
            {sending ? (
              <>Processing Dispatch...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Dispatch to {parsedEmails.length} Recipient{parsedEmails.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
