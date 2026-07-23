import React from 'react';
import { ShieldAlert, CheckCircle2, AlertOctagon, ExternalLink } from 'lucide-react';

export const SpamDiagnosticCard: React.FC = () => {
  return (
    <div className="glass-panel p-6 mb-8 border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/60">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Deliverability & Inbox vs. Spam Diagnostics
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Standard SMTP protocols report <span className="font-mono text-emerald-400">250 OK</span> upon delivery to Gmail/Outlook servers. The recipient server then decides whether to place the email into <span className="font-semibold text-emerald-400">Inbox</span> or <span className="font-semibold text-rose-400">Spam</span> based on sender domain authentication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">1. SPF Alignment</span>
              <p className="text-slate-400">Authorizes your SMTP IP to send emails on behalf of your domain.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">2. DKIM Cryptographic Key</span>
              <p className="text-slate-400">Cryptographically signs email headers to prevent content tampering in transit.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">3. DMARC Policy</span>
              <p className="text-slate-400">Instructs Gmail/Outlook to deliver messages directly to Inbox if SPF & DKIM pass.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
