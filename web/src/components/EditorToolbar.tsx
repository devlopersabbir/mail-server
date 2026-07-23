import React, { useState } from 'react';
import { Bold, Italic, Heading1, Heading2, List, Link as LinkIcon, ExternalLink, Eraser } from 'lucide-react';
import { InsertModal, ModalConfig } from './InsertModal';

interface EditorToolbarProps {
  execCmd: (cmd: string, val?: string) => void;
  insertSnippet: (html: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ execCmd, insertSnippet }) => {
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (config: ModalConfig) => {
    setModalConfig(config);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (val1: string, val2?: string) => {
    if (!modalConfig) return;

    if (modalConfig.type === 'h1') {
      const h1Html = `<h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin: 14px 0 8px 0;">${val1}</h1><p><br/></p>`;
      insertSnippet(h1Html);
    } else if (modalConfig.type === 'h2') {
      const h2Html = `<h2 style="font-size: 20px; font-weight: 700; color: #818cf8; margin: 12px 0 6px 0;">${val1}</h2><p><br/></p>`;
      insertSnippet(h2Html);
    } else if (modalConfig.type === 'link' && val2) {
      const linkHtml = `<a href="${val2}" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">${val1}</a>&nbsp;`;
      insertSnippet(linkHtml);
    } else if (modalConfig.type === 'button' && val2) {
      const btnHtml = `<div style="margin: 16px 0;"><a href="${val2}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: Arial, sans-serif;">${val1}</a></div><p><br/></p>`;
      insertSnippet(btnHtml);
    }
  };

  const insertBulletedList = () => {
    const listHtml = `<ul style="list-style-type: disc; padding-left: 24px; margin: 8px 0;"><li style="display: list-item;">First item</li><li style="display: list-item;">Second item</li></ul><p><br/></p>`;
    insertSnippet(listHtml);
  };

  return (
    <>
      <div className="mb-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center gap-1.5 text-xs shadow-inner">
        <button
          type="button"
          onClick={() => execCmd('bold')}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all font-bold"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('italic')}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all italic"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 my-auto" />

        <button
          type="button"
          onClick={() => openModal({ type: 'h1', title: 'Insert Main Title Heading', field1Label: 'Heading Text', field1Placeholder: 'e.g. Special Product Announcement' })}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all font-extrabold flex items-center gap-1"
          title="Main Heading H1"
        >
          <Heading1 className="h-4 w-4" /> H1
        </button>

        <button
          type="button"
          onClick={() => openModal({ type: 'h2', title: 'Insert Section Subheading', field1Label: 'Subheading Text', field1Placeholder: 'e.g. Key Features & Benefits' })}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all font-bold flex items-center gap-1"
          title="Subheading H2"
        >
          <Heading2 className="h-4 w-4" /> H2
        </button>

        <div className="h-4 w-px bg-slate-800 my-auto" />

        <button
          type="button"
          onClick={insertBulletedList}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all"
          title="Bulleted List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => openModal({ type: 'link', title: 'Insert Hyperlink', field1Label: 'Display Text', field1Placeholder: 'e.g. Visit Our Website', field2Label: 'Destination URL', field2Placeholder: 'https://yourwebsite.com' })}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-sky-400 hover:text-white transition-all flex items-center gap-1 font-semibold"
          title="Insert Hyperlink"
        >
          <LinkIcon className="h-4 w-4 text-sky-400" /> Link
        </button>

        <button
          type="button"
          onClick={() => openModal({ type: 'button', title: 'Insert Email Action CTA Button', field1Label: 'Button Text', field1Placeholder: 'e.g. Claim Offer Now', field2Label: 'Destination URL', field2Placeholder: 'https://yourwebsite.com/claim' })}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1 font-semibold"
          title="Action CTA Button"
        >
          <ExternalLink className="h-4 w-4" /> CTA Button
        </button>

        <button
          type="button"
          onClick={() => execCmd('removeFormat')}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
          title="Clear Format"
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      <InsertModal
        config={modalConfig}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </>
  );
};
