import React, { useState } from 'react';
import { fetchJobStatus } from '../services/api';
import { Job } from '../types';
import { Search, Clock, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';

export const JobTracker: React.FC = () => {
  const [jobId, setJobId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [job, setJob] = useState<Job | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setJob(null);

    try {
      const res = await fetchJobStatus(jobId.trim());
      if (res.data) {
        setJob(res.data);
      } else {
        setErrorMsg('Job not found');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch job status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 pb-6 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          Job Status & Dispatch Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect real-time dispatch state and recipient email open tracking logs by Job ID.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-4 top-3.5 text-slate-500" />
          <input
            type="text"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Enter Job ID (e.g. job_1784838000123_a1b2c3)..."
            className="w-full glass-input pl-11 font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Inspect Job'}
        </button>
      </form>

      {errorMsg && (
        <div className="p-4 rounded-xl mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {job && (
        <div className="space-y-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase">Job Reference ID</span>
              <h3 className="font-mono text-base text-indigo-400 font-semibold">{job.id}</h3>
            </div>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 ${
                job.status === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : job.status === 'failed'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {job.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
              {job.status === 'failed' && <AlertCircle className="h-3.5 w-3.5" />}
              {job.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Subject</span>
              <span className="text-slate-200 font-medium">{job.message.subject}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Created Timestamp</span>
              <span className="text-slate-200 font-mono">{new Date(job.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Recipient Open Tracking Log */}
          <div>
            <span className="text-xs text-slate-500 block mb-2">Recipient Delivery & Open Tracking Log</span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {job.message.to.map((recipient, idx) => {
                const isOpened = job.opened_recipients?.includes(recipient);
                const openTime = job.opened_at?.[recipient];

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-slate-300">{recipient}</span>
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

          {job.error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs font-mono">
              <strong className="block text-rose-400 font-semibold mb-1">Error Diagnostic Log:</strong>
              {job.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
