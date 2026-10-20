import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Shield, Filter, Eye } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedMeta, setSelectedMeta] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs(page, 20, actionFilter || undefined);
      setLogs(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Privacy Guarantee Banner */}
      <div className="p-4 bg-navy-900/5 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-white block">
            Zero Raw Sensitive Data in Audit Trails
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            PrivacyGuard AI records operational security events (logins, scans, redactions, reviews, deletions) while strictly omitting raw source texts, passwords, and sensitive entity values to prevent audit log leakage.
          </span>
        </div>
      </div>

      {/* Audit Log Table Card */}
      <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-gold-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              System Audit Trail ({total} Events)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={e => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300"
              >
                <option value="">All Actions</option>
                <option value="text_scanned">text_scanned</option>
                <option value="text_redacted">text_redacted</option>
                <option value="job_completed">job_completed</option>
                <option value="job_review_approved">job_review_approved</option>
                <option value="job_review_rejected">job_review_rejected</option>
                <option value="retention_cleanup_executed">retention_cleanup_executed</option>
                <option value="privacy_settings_updated">privacy_settings_updated</option>
              </select>
            </div>

            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-navy-700">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Linked Job</th>
                  <th className="py-2.5 px-4">Event Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-700/60">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-700/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white font-mono">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.actor}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {log.job_id ? `${log.job_id.substring(0, 8)}...` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {log.metadata_json ? (
                        <button
                          onClick={() => setSelectedMeta(log.metadata_json!)}
                          className="flex items-center gap-1 text-[11px] font-mono text-navy-800 dark:text-gold-400 hover:underline max-w-xs truncate"
                        >
                          <Eye className="w-3 h-3 shrink-0" />
                          <span className="truncate">{log.metadata_json}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 bg-slate-50 dark:bg-navy-900/60 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {Math.max(1, Math.ceil(total / 20))}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Detail Dialog */}
      {selectedMeta && (
        <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Audit Event Metadata Details
            </h4>
            <button
              onClick={() => setSelectedMeta(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <pre className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
            {JSON.stringify(JSON.parse(selectedMeta), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
