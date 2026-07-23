import React, { useRef } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';

interface RecipientSelectorProps {
  recipientsInput: string;
  setRecipientsInput: (val: string) => void;
  parsedEmails: string[];
  setParsedEmails: (emails: string[]) => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  recipientsInput,
  setRecipientsInput,
  parsedEmails,
  setParsedEmails,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseEmails = (text: string) => {
    const raw = text.split(/[\n,;]+/).map((e) => e.trim()).filter((e) => e.length > 0 && e.includes('@'));
    setParsedEmails(Array.from(new Set(raw)));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  return (
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
        rows={3}
        value={recipientsInput}
        onChange={handleChange}
        placeholder="Paste comma or newline separated email addresses (e.g. user1@test.com, user2@test.com)..."
        className="w-full glass-input font-mono text-xs"
        required
      />

      <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Private 1-to-1 Fan-Out & 1x1 Pixel Tracking:</strong> Sent privately to each individual recipient (`To: recipient@domain.com`).
        </span>
      </div>
    </div>
  );
};
