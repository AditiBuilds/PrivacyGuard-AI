import React from 'react';
import { PiiFinding } from '../../types';
import { ShieldCheck, Tag, Cpu, Code2 } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

interface PiiFindingsTableProps {
  findings: PiiFinding[];
}

export const PiiFindingsTable: React.FC<PiiFindingsTableProps> = ({ findings }) => {
  if (findings.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-navy-800/50 rounded-xl border border-slate-200 dark:border-navy-700">
        No personally identifiable entities detected. Text is safe from identified PII.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800/80 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gold-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Detected Findings ({findings.length})
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Calibrated detection confidence
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-navy-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-navy-700">
            <tr>
              <th className="py-2.5 px-4">Entity Category</th>
              <th className="py-2.5 px-4">Masked Preview</th>
              <th className="py-2.5 px-4">Confidence</th>
              <th className="py-2.5 px-4">Offsets</th>
              <th className="py-2.5 px-4">Method</th>
              <th className="py-2.5 px-4">Token Label</th>
              <th className="py-2.5 px-4">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-700/60">
            {findings.map((f, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-navy-700/40 transition">
                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                  {f.entity_type}
                </td>
                <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                  {f.match_preview || '***'}
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy-900 dark:bg-gold-500 rounded-full"
                        style={{ width: `${Math.round(f.confidence * 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {Math.round(f.confidence * 100)}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  [{f.start_offset}:{f.end_offset}]
                </td>
                <td className="py-2.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300">
                    {f.detection_method === 'rule' ? (
                      <Code2 className="w-3 h-3 text-sky-500" />
                    ) : (
                      <Cpu className="w-3 h-3 text-gold-500" />
                    )}
                    {f.detection_method}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-mono text-[11px] text-navy-800 dark:text-gold-400 font-semibold">
                  {f.token_label || '-'}
                </td>
                <td className="py-2.5 px-4">
                  <RiskBadge level={f.severity} showIcon={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
