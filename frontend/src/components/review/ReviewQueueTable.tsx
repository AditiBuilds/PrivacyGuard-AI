import React, { useState } from 'react';
import { ProcessingJob } from '../../types';
import { CheckCircle2, XCircle, Eye, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface ReviewQueueTableProps {
  jobs: ProcessingJob[];
  onActionComplete: () => void;
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({
  jobs,
  onActionComplete,
}) => {
  const { addToast } = useApp();
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingJobs = jobs.filter(j => j.status === 'pending_review' || (j.human_review_required && j.approval_status === 'pending'));

  const handleApprove = async (jobId: string) => {
    setProcessingId(jobId);
    try {
      await api.approveJob(jobId, 'Authorized by human reviewer');
      addToast('success', 'Job Approved', `Job ${jobId.substring(0, 8)} approved and downstream AI task executed.`);
      onActionComplete();
      if (selectedJob?.id === jobId) setSelectedJob(null);
    } catch (e: any) {
      addToast('error', 'Approval Failed', e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (jobId: string) => {
    setProcessingId(jobId);
    try {
      await api.rejectJob(jobId, 'Rejected by human reviewer');
      addToast('info', 'Job Rejected', `Job ${jobId.substring(0, 8)} rejected. Downstream execution blocked.`);
      onActionComplete();
      if (selectedJob?.id === jobId) setSelectedJob(null);
    } catch (e: any) {
      addToast('error', 'Rejection Failed', e.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingJobs.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-navy-800/40 rounded-xl border border-slate-200 dark:border-navy-700">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          Review Queue Clear
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          No processing jobs currently pending human authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800/80 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Pending Human Approvals ({pendingJobs.length})
          </h4>
        </div>
        <span className="text-xs text-slate-400">
          Backend state transitions strictly enforced
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-navy-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-navy-700">
            <tr>
              <th className="py-2.5 px-4">Job ID</th>
              <th className="py-2.5 px-4">Submitted</th>
              <th className="py-2.5 px-4">Task Type</th>
              <th className="py-2.5 px-4">Purpose</th>
              <th className="py-2.5 px-4">Risk Level</th>
              <th className="py-2.5 px-4">Findings</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-700/60">
            {pendingJobs.map(job => (
              <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-700/40 transition">
                <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                  {job.id.substring(0, 8)}...
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                  {new Date(job.created_at).toLocaleTimeString()}
                </td>
                <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  {job.task_type}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                  {job.processing_purpose}
                </td>
                <td className="py-3 px-4">
                  <RiskBadge level={job.risk_level} score={job.risk_score} />
                </td>
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                  {job.detections_count} entities
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-600 dark:text-slate-300 transition"
                      title="Inspect Redacted Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReject(job.id)}
                      disabled={processingId === job.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(job.id)}
                      disabled={processingId === job.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Dialog */}
      {selectedJob && (
        <div className="p-4 bg-slate-50 dark:bg-navy-900/60 border-t border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Preview for Job {selectedJob.id}:
            </span>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="bg-white dark:bg-navy-950 p-3 rounded-lg border border-slate-200 dark:border-navy-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {selectedJob.redacted_output || selectedJob.input_preview || 'No preview available.'}
          </div>
        </div>
      )}
    </div>
  );
};
