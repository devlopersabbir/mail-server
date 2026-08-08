import React from 'react';
import { Star, Reply, MoreVertical, Printer, ExternalLink, ShieldCheck, Lock, Shield } from 'lucide-react';

interface GmailInboxPreviewProps {
  subject: string;
  htmlBody: string;
  body: string;
}

export const GmailInboxPreview: React.FC<GmailInboxPreviewProps> = ({ subject, htmlBody, body }) => {
  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-xl bg-[#1f1f1f] text-[#e3e3e3] shadow-2xl border border-slate-800 overflow-hidden font-sans text-sm">
      {/* Gmail Dark Mode Top Action Bar */}
      <div className="bg-[#2d2d2d] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-xs tracking-wide">Gmail Dark</span>
          <h3 className="text-lg font-semibold text-white line-clamp-1">
            {subject || '(No Subject Specified)'}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <Star className="h-4 w-4 cursor-pointer hover:text-amber-400" />
          <Printer className="h-4 w-4 cursor-pointer hover:text-slate-200" />
          <ExternalLink className="h-4 w-4 cursor-pointer hover:text-slate-200" />
        </div>
      </div>

      {/* Gmail Sender Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-start justify-between bg-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Sender Name</span>
              <span className="text-xs text-slate-400">&lt;sender@example.com&gt;</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>to <span className="font-medium text-slate-200">me</span></span>
              {/* Security authentication indicators */}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                  <Shield className="h-2.5 w-2.5" /> SPF: PASS
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                  <Lock className="h-2.5 w-2.5" /> DKIM: PASS
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                  <ShieldCheck className="h-2.5 w-2.5" /> DMARC: PASS
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{formattedTime} (Just now)</span>
          <Reply className="h-4 w-4 cursor-pointer hover:text-slate-200" />
          <MoreVertical className="h-4 w-4 cursor-pointer hover:text-slate-200" />
        </div>
      </div>

      {/* Gmail Dark Mode Email Body Canvas */}
      <div className="p-8 bg-[#181818] min-h-[260px] text-[#e3e3e3] leading-relaxed font-sans">
        <style>{`
          .gmail-dark-body h1 { font-size: 24px !important; font-weight: 700 !important; color: #ffffff !important; margin: 12px 0 !important; }
          .gmail-dark-body h2 { font-size: 18px !important; font-weight: 700 !important; color: #818cf8 !important; margin: 10px 0 !important; }
          .gmail-dark-body ul { list-style-type: disc !important; padding-left: 20px !important; margin: 8px 0 !important; }
          .gmail-dark-body ol { list-style-type: decimal !important; padding-left: 20px !important; margin: 8px 0 !important; }
          .gmail-dark-body li { display: list-item !important; margin-bottom: 4px !important; }
          .gmail-dark-body a { color: #38bdf8 !important; text-decoration: underline !important; font-weight: 500 !important; }
        `}</style>
        {htmlBody || body ? (
          <div
            className="gmail-dark-body prose prose-invert max-w-none text-[#e3e3e3] text-sm"
            dangerouslySetInnerHTML={{
              __html: htmlBody || (body ? `<div style="font-family: Arial, sans-serif; font-size: 15px; color: #e3e3e3; line-height: 1.6;">${body.replace(/\n/g, '<br/>')}</div>` : ''),
            }}
          />
        ) : (
          <p className="text-slate-500 text-xs italic">No email content written yet.</p>
        )}
      </div>
    </div>
  );
};
