import React, { useEffect } from 'react';

interface VisualCanvasProps {
  htmlBody: string;
  body: string;
  setHtmlBody: (val: string) => void;
  setBody: (val: string) => void;
  activeTab: 'editor' | 'code' | 'preview';
  editorRef: React.RefObject<HTMLDivElement>;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  htmlBody,
  body,
  setHtmlBody,
  setBody,
  activeTab,
  editorRef,
}) => {
  const syncStateFromCanvas = () => {
    if (editorRef.current) {
      setHtmlBody(editorRef.current.innerHTML);
      setBody(editorRef.current.innerText);
    }
  };

  useEffect(() => {
    if (activeTab === 'editor' && editorRef.current) {
      const contentToLoad = htmlBody || (body ? `<div style="font-family: Arial, sans-serif; font-size: 15px; color: #f8fafc; line-height: 1.6;">${body.replace(/\n/g, '<br/>')}</div>` : '');
      if (editorRef.current.innerHTML !== contentToLoad) {
        editorRef.current.innerHTML = contentToLoad;
      }
    }
  }, [activeTab, htmlBody]);

  return (
    <div className="relative">
      <style>{`
        .visual-canvas-body h1 { font-size: 26px !important; font-weight: 800 !important; color: #ffffff !important; margin: 14px 0 8px 0 !important; display: block !important; }
        .visual-canvas-body h2 { font-size: 20px !important; font-weight: 700 !important; color: #818cf8 !important; margin: 12px 0 6px 0 !important; display: block !important; }
        .visual-canvas-body ul { list-style-type: disc !important; padding-left: 24px !important; margin: 8px 0 !important; display: block !important; }
        .visual-canvas-body ol { list-style-type: decimal !important; padding-left: 24px !important; margin: 8px 0 !important; display: block !important; }
        .visual-canvas-body li { display: list-item !important; margin-bottom: 4px !important; }
        .visual-canvas-body a { color: #38bdf8 !important; text-decoration: underline !important; font-weight: 600 !important; }
        .visual-canvas-body b, .visual-canvas-body strong { font-weight: bold !important; color: #ffffff !important; }
        .visual-canvas-body i, .visual-canvas-body em { font-style: italic !important; }
      `}</style>
      <div
        ref={editorRef}
        contentEditable={true}
        onInput={syncStateFromCanvas}
        onBlur={syncStateFromCanvas}
        onKeyUp={syncStateFromCanvas}
        className="visual-canvas-body w-full min-h-[220px] max-h-[400px] overflow-y-auto p-6 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 shadow-2xl font-sans text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        style={{ minHeight: '220px' }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};
