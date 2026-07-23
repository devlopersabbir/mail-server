import React, { useState, useEffect } from 'react';
import { ConfigResponse, ConfigUpdateRequest, ProviderType } from '../types';
import { fetchConfiguration, updateConfiguration } from '../services/api';
import { Server, Key, Mail, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Cpu } from 'lucide-react';

export const ConfigurationForm: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [provider, setProvider] = useState<ProviderType>('smtp');
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<string>('587');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [senderPassword, setSenderPassword] = useState<string>('');

  const [awsRegion, setAwsRegion] = useState<string>('us-east-1');
  const [awsAccessKey, setAwsAccessKey] = useState<string>('');
  const [awsSecretKey, setAwsSecretKey] = useState<string>('');

  const [maxWorkers, setMaxWorkers] = useState<number>(50);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetchConfiguration();
      if (res.data) {
        const c = res.data;
        setProvider(c.provider || 'smtp');
        if (c.smtp_host) setSmtpHost(c.smtp_host);
        if (c.smtp_port) setSmtpPort(c.smtp_port);
        if (c.sender_email) setSenderEmail(c.sender_email);
        if (c.aws_region) setAwsRegion(c.aws_region);
        if (c.aws_access_key_id) setAwsAccessKey(c.aws_access_key_id);
        if (c.max_workers) setMaxWorkers(c.max_workers);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const payload: ConfigUpdateRequest = {
      provider,
      sender_email: senderEmail,
      max_workers: Number(maxWorkers),
    };

    if (provider === 'smtp') {
      payload.smtp_host = smtpHost;
      payload.smtp_port = smtpPort;
      if (senderPassword) payload.sender_password = senderPassword;
    } else if (provider === 'aws_ses') {
      payload.aws_region = awsRegion;
      payload.aws_access_key_id = awsAccessKey;
      if (awsSecretKey) payload.aws_secret_access_key = awsSecretKey;
    }

    try {
      const res = await updateConfiguration(payload);
      setStatusMsg({ type: 'success', text: res.message || 'Configuration updated successfully' });
      setSenderPassword('');
      setAwsSecretKey('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update configuration' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-8 text-center">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading active mail server configuration...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-400" />
            Mail Provider & Engine Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic SMTP relays or AWS SES credentials. Settings apply instantly in runtime memory.
          </p>
        </div>
        <button
          type="button"
          onClick={loadConfig}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
          title="Refresh Config"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl mb-6 border text-sm flex items-center gap-3 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Active Provider Engine
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setProvider('smtp')}
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                provider === 'smtp'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white ring-1 ring-indigo-500'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Standard SMTP Relay</h3>
                <p className="text-xs text-slate-400">Gmail, Custom Corporate SMTP, SendGrid Relay</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('aws_ses')}
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                provider === 'aws_ses'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white ring-1 ring-indigo-500'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="p-3 rounded-lg bg-amber-500/20 text-amber-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Amazon SES (AWS)</h3>
                <p className="text-xs text-slate-400">High-Volume High-Deliverability Cloud Mail</p>
              </div>
            </button>
          </div>
        </div>

        {/* Sender Email (Shared) */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300 mb-2">Default Sender Email Address (From)</label>
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="e.g. notifications@yourdomain.com"
            required
            className="w-full glass-input"
          />
        </div>

        {/* Provider Specific Settings */}
        {provider === 'smtp' ? (
          <div className="space-y-4 p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/30">
            <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-400" />
              SMTP Connection Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                SMTP App Password / Auth Secret (Leave empty to keep existing password)
              </label>
              <input
                type="password"
                value={senderPassword}
                onChange={(e) => setSenderPassword(e.target.value)}
                placeholder="•••• •••• •••• ••••"
                className="w-full glass-input font-mono"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5 rounded-2xl bg-amber-950/20 border border-amber-900/30">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              Amazon SES Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">AWS Region</label>
                <input
                  type="text"
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  placeholder="us-east-1"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">AWS Access Key ID</label>
                <input
                  type="text"
                  value={awsAccessKey}
                  onChange={(e) => setAwsAccessKey(e.target.value)}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="w-full glass-input font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                AWS Secret Access Key (Leave empty to keep existing secret)
              </label>
              <input
                type="password"
                value={awsSecretKey}
                onChange={(e) => setAwsSecretKey(e.target.value)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full glass-input font-mono"
              />
            </div>
          </div>
        )}

        {/* Worker Pool Controls */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-400" />
            Parallel Worker Pool Capacity
          </label>
          <input
            type="number"
            value={maxWorkers}
            onChange={(e) => setMaxWorkers(Number(e.target.value))}
            min={1}
            max={500}
            className="w-full glass-input"
          />
          <p className="text-xs text-slate-500 mt-1">Number of concurrent goroutine workers processing queued dispatches.</p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="glass-button bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/25 px-8 py-3"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating State...
              </>
            ) : (
              'Save & Apply Configuration'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
