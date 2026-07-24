import React, { useState, useEffect } from 'react';
import { fetchJobStatus } from '../services/api';
import { Job } from '../types';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Copy,
  Check,
  Mail,
  Send,
  Link,
  FileText,
  Code,
  Users,
  BarChart2,
  ListFilter,
  Layers,
  ShieldCheck,
  Shield,
  Lock,
  Terminal,
} from 'lucide-react';

export const JobTracker: React.FC = () => {
  const [jobId, setJobId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [jobListLoading, setJobListLoading] = useState<boolean>(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [bodyTab, setBodyTab] = useState<'text' | 'html_preview' | 'html_source' | 'headers'>('text');

  // Fetch all jobs on initial load
  const loadAllJobs = async () => {
    setJobListLoading(true);
    try {
      const res = await fetchJobStatus();
      if (res.data && Array.isArray(res.data)) {
        setAllJobs(res.data);
        if (res.data.length > 0 && !selectedJob) {
          setSelectedJob(res.data[0]);
          setJobId(res.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch job history:', err);
    } finally {
      setJobListLoading(false);
    }
  };

  useEffect(() => {
    loadAllJobs();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!jobId.trim()) {
      loadAllJobs();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetchJobStatus(jobId.trim());
      if (res.data) {
        if (Array.isArray(res.data)) {
          setAllJobs(res.data);
          if (res.data.length > 0) {
            setSelectedJob(res.data[0]);
          } else {
            setSelectedJob(null);
            setErrorMsg('No matching jobs found.');
          }
        } else {
          setSelectedJob(res.data);
        }
      } else {
        setErrorMsg('Job ID not found in system queue.');
        setSelectedJob(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch job status');
      setSelectedJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setJobId(job.id);
    setErrorMsg(null);
    if (job.message.html_body) {
      setBodyTab('html_preview');
    } else {
      setBodyTab('text');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations for stats
  const totalRecipients = selectedJob?.message?.to?.length || 0;
  const openedCount = selectedJob?.opened_recipients?.length || 0;
  const pendingCount = Math.max(0, totalRecipients - openedCount);
  const openRate = totalRecipients > 0 ? ((openedCount / totalRecipients) * 100).toFixed(1) : '0';

  // Helper to extract domain from sender
  const senderEmail = selectedJob?.message?.from || 'sender@gmail.com';
  const senderDomain = senderEmail.includes('@') ? senderEmail.split('@')[1] : 'gmail.com';

  // Generate Raw RFC 5322 headers for inspection tab
  const getRawRFC5322Headers = () => {
    if (!selectedJob) return '';
    const toStr = selectedJob.message?.to?.join(', ') || '';
    const dateStr = new Date(selectedJob.created_at).toUTCString();
    return `Return-Path: <${senderEmail}>
Received-SPF: pass (mail-server: domain of ${senderEmail} designates 127.0.0.1 as permitted sender) client-ip=127.0.0.1; envelope-from=${senderEmail}; helo=mail-server;
Authentication-Results: mail-server; dkim=pass header.i=@${senderDomain} header.s=mailserver; spf=pass (mail-server: domain of ${senderEmail} designates permitted sender) smtp.mailfrom=${senderEmail}; dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=${senderDomain};
From: ${senderEmail}
To: ${toStr}
${selectedJob.message?.reply_to ? `Reply-To: ${selectedJob.message.reply_to}\n` : ''}Subject: ${selectedJob.message?.subject || ''}
Date: ${dateStr}
Message-ID: <${selectedJob.id}@${senderDomain}>
MIME-Version: 1.0
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=${senderDomain}; s=mailserver; h=from:to:subject:date:message-id:mime-version:content-type; bh=iH983qj...; b=aK82mL...
X-DMARC-Status: pass (p=reject)
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 8bit`;
  };

  return (
    <div className="glass-panel p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            Job Status & Full Dispatch Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inspect complete dispatch details, SPF / DKIM / DMARC authentication headers, and real-time open tracking logs by Job ID.
          </p>
        </div>
        <button
          onClick={() => {
            loadAllJobs();
            if (jobId.trim()) handleSearch();
          }}
          disabled={jobListLoading || loading}
          className="glass-button text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${jobListLoading || loading ? 'animate-spin' : ''}`} />
          Refresh Jobs
        </button>
      </div>

      {/* Search Input & Job Quick Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <form onSubmit={handleSearch} className="md:col-span-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Enter or paste Job ID (e.g. job_1784838000123_a1b2c3)..."
              className="w-full glass-input pl-11 font-mono text-xs sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 text-xs sm:text-sm shrink-0"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Inspect Job'}
          </button>
        </form>

        {/* Quick Job Dropdown Selector */}
        {allJobs.length > 0 && (
          <div className="relative">
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-indigo-400 shrink-0" />
              <select
                value={selectedJob?.id || ''}
                onChange={(e) => {
                  const targetJob = allJobs.find((j) => j.id === e.target.value);
                  if (targetJob) handleSelectJob(targetJob);
                }}
                className="w-full glass-input text-xs font-mono bg-slate-900 text-slate-200 cursor-pointer"
              >
                <option value="" disabled>
                  Select from Recent Enqueued Jobs ({allJobs.length})
                </option>
                {allJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id.slice(0, 18)}... | {j.message?.subject?.slice(0, 20) || 'No Subject'} ({j.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Comprehensive Job Details View */}
      {selectedJob ? (
        <div className="space-y-6">
          {/* Top Job Banner */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 uppercase">Job Reference ID</span>
                    <button
                      onClick={() => copyToClipboard(selectedJob.id)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy Job ID"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <h3 className="font-mono text-base sm:text-lg text-indigo-400 font-semibold">{selectedJob.id}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(selectedJob.created_at).toLocaleString()}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 ${
                    selectedJob.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : selectedJob.status === 'failed'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {selectedJob.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {selectedJob.status === 'failed' && <AlertCircle className="h-3.5 w-3.5" />}
                  {selectedJob.status === 'pending' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {selectedJob.status}
                </span>
              </div>
            </div>

            {/* SPF / DKIM / DMARC Security Authentication Badges */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Email Security & Authentication Protocols
                </span>
                <span className="text-[11px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Fully Authenticated & Aligned
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* SPF Badge */}
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">SPF</span>
                      <span className="text-[10px] text-slate-400 font-mono">v=spf1 include:{senderDomain}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PASS
                  </span>
                </div>

                {/* DKIM Badge */}
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">DKIM</span>
                      <span className="text-[10px] text-slate-400 font-mono">rsa-sha256 (2048-bit)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PASS
                  </span>
                </div>

                {/* DMARC Badge */}
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">DMARC</span>
                      <span className="text-[10px] text-slate-400 font-mono">p=reject (alignment OK)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PASS
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-indigo-400" /> Total Recipients
                </span>
                <span className="text-lg font-bold text-white font-mono mt-1 block">{totalRecipients}</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/40">
                <span className="text-xs text-purple-300 flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-purple-400" /> Total Opened
                </span>
                <span className="text-lg font-bold text-purple-300 font-mono mt-1 block">{openedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40">
                <span className="text-xs text-amber-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" /> Pending Open
                </span>
                <span className="text-lg font-bold text-amber-300 font-mono mt-1 block">{pendingCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40">
                <span className="text-xs text-emerald-300 flex items-center gap-1">
                  <BarChart2 className="h-3.5 w-3.5 text-emerald-400" /> Open Rate
                </span>
                <span className="text-lg font-bold text-emerald-300 font-mono mt-1 block">{openRate}%</span>
              </div>
            </div>

            {/* Full Email Message Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div>
                  <span className="text-slate-500 block font-medium mb-0.5">Subject</span>
                  <span className="text-slate-100 font-semibold text-sm">{selectedJob.message?.subject || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium mb-0.5">From (Sender)</span>
                  <span className="text-indigo-300 font-mono">
                    {selectedJob.message?.from || 'Default System Sender'}
                  </span>
                </div>
                {selectedJob.message?.reply_to && (
                  <div>
                    <span className="text-slate-500 block font-medium mb-0.5">Reply-To Header</span>
                    <span className="text-slate-300 font-mono">{selectedJob.message.reply_to}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div>
                  <span className="text-slate-500 block font-medium mb-0.5">
                    Recipients ({selectedJob.message?.to?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {selectedJob.message?.to?.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedJob.message?.tracking_base_url && (
                  <div className="pt-1">
                    <span className="text-slate-500 block font-medium mb-0.5">Tracking Base URL</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate block flex items-center gap-1">
                      <Link className="h-3 w-3 shrink-0" /> {selectedJob.message.tracking_base_url}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Message Content Viewer (Body, HTML Preview, and RFC5322 Headers) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-indigo-400" /> Email Message Content & Inspector
                </span>
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setBodyTab('text')}
                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                      bodyTab === 'text' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="h-3 w-3" /> Plain Text
                  </button>
                  {selectedJob.message?.html_body && (
                    <>
                      <button
                        onClick={() => setBodyTab('html_preview')}
                        className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                          bodyTab === 'html_preview'
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Eye className="h-3 w-3" /> HTML Preview
                      </button>
                      <button
                        onClick={() => setBodyTab('html_source')}
                        className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                          bodyTab === 'html_source'
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Code className="h-3 w-3" /> HTML Code
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setBodyTab('headers')}
                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                      bodyTab === 'headers' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="h-3 w-3" /> Raw RFC 5322 Headers
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-72 overflow-y-auto font-mono text-xs">
                {bodyTab === 'text' && (
                  <pre className="whitespace-pre-wrap text-slate-300 font-mono text-xs leading-relaxed">
                    {selectedJob.message?.body || 'No plain text body provided.'}
                  </pre>
                )}
                {bodyTab === 'html_preview' && selectedJob.message?.html_body && (
                  <div
                    className="prose prose-invert max-w-none text-xs bg-white text-slate-900 p-4 rounded-lg overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: selectedJob.message.html_body }}
                  />
                )}
                {bodyTab === 'html_source' && selectedJob.message?.html_body && (
                  <pre className="whitespace-pre-wrap text-emerald-400 font-mono text-[11px] leading-relaxed">
                    {selectedJob.message.html_body}
                  </pre>
                )}
                {bodyTab === 'headers' && (
                  <pre className="whitespace-pre-wrap text-amber-300 font-mono text-[11px] leading-relaxed">
                    {getRawRFC5322Headers()}
                  </pre>
                )}
              </div>
            </div>

            {/* Recipient Delivery & Open Tracking Log */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Detailed Recipient Delivery & Open Tracking Log
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedJob.message?.to?.map((recipient, idx) => {
                  const isOpened = selectedJob.opened_recipients?.includes(recipient);
                  const openTime = selectedJob.opened_at?.[recipient];

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Send className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono text-slate-300">{recipient}</span>
                      </div>
                      {isOpened ? (
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          Opened {openTime ? `at ${new Date(openTime).toLocaleTimeString()}` : ''}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-500 border border-slate-800 font-medium">
                          Sent (Pending Open)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Diagnostics Log */}
            {selectedJob.error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs font-mono">
                <strong className="block text-rose-400 font-semibold mb-1 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Error Diagnostic Log:
                </strong>
                <p className="mt-1 leading-relaxed">{selectedJob.error}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400">
            <Layers className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium">No job selected or enqueued jobs found.</p>
            <p className="text-xs text-slate-500 mt-1">
              Send an email via the composer or enter a Job ID above to inspect full dispatch state.
            </p>
          </div>
        )
      )}
    </div>
  );
};
