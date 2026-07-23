import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface ModalConfig {
  type: 'link' | 'h1' | 'h2' | 'button';
  title: string;
  field1Label: string;
  field1Placeholder: string;
  field2Label?: string;
  field2Placeholder?: string;
}

interface InsertModalProps {
  config: ModalConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (val1: string, val2?: string) => void;
}

export const InsertModal: React.FC<InsertModalProps> = ({ config, isOpen, onClose, onSubmit }) => {
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVal1('');
      setVal2('');
    }
  }, [isOpen]);

  if (!isOpen || !config) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val1) return;
    onSubmit(val1, val2);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel p-6 max-w-md w-full border border-slate-700/80 shadow-2xl rounded-2xl relative bg-slate-900/95 text-slate-100">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {config.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">{config.field1Label}</label>
            <input
              type="text"
              value={val1}
              onChange={(e) => setVal1(e.target.value)}
              placeholder={config.field1Placeholder}
              autoFocus
              required
              className="w-full glass-input"
            />
          </div>

          {config.field2Label && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{config.field2Label}</label>
              <input
                type="url"
                value={val2}
                onChange={(e) => setVal2(e.target.value)}
                placeholder={config.field2Placeholder}
                required
                className="w-full glass-input"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              Insert Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
