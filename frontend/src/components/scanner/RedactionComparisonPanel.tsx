import React, { useState } from 'react';
import { Copy, Check, Download, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RedactionComparisonPanelProps {
  originalText: string;
  redactedText: string;
  tokenMapping?: Record<string, string>;
}

export const RedactionComparisonPanel: React.FC<RedactionComparisonPanelProps> = ({
  originalText,
  redactedText,
  tokenMapping = {},
}) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useApp();

  const handleCopy = () => {
    navigator.clipboard.writeText(redactedText);
    setCopied(true);
    addToast('success', 'Copied to Clipboard', 'Redacted text copied successfully.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([redactedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacyguard_redacted_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'File Downloaded', 'Redacted document saved to disk.');
  };

  return (
    <div className="bg-white dark:bg-navy-800/80 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Redaction Output & Context Preservation
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Redacted'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-900 dark:bg-gold-500 hover:bg-navy-800 dark:hover:bg-gold-400 text-white dark:text-slate-950 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-navy-700">
        {/* Original Text View */}
        <div className="p-4 flex flex-col">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Original Source Text
          </span>
          <div className="flex-1 bg-slate-50 dark:bg-navy-950/60 p-3.5 rounded-lg border border-slate-200/80 dark:border-navy-800/80 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
            {originalText || 'No text submitted.'}
          </div>
        </div>

        {/* Redacted Text View */}
        <div className="p-4 flex flex-col">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center justify-between">
            <span>Redacted Safe Output</span>
            <span className="text-[11px] font-normal text-slate-400">Context Preserved</span>
          </span>
          <div className="flex-1 bg-emerald-50/20 dark:bg-navy-950/80 p-3.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-72 overflow-y-auto">
            {redactedText || 'No redaction output generated yet.'}
          </div>
        </div>
      </div>

      {/* Token Mapping Footer */}
      {Object.keys(tokenMapping).length > 0 && (
        <div className="p-4 bg-slate-50/70 dark:bg-navy-900/50 border-t border-slate-200 dark:border-navy-700">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Replacement Tokens Registry ({Object.keys(tokenMapping).length})
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tokenMapping).map(([token, preview]) => (
              <span
                key={token}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-2xs font-mono"
              >
                <span className="font-semibold text-navy-800 dark:text-gold-400">{token}</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-500 dark:text-slate-400">{preview}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
