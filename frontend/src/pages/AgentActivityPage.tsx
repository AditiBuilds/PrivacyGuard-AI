import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Eye, Bot, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { ProcessingJob, AgentTraceResponse } from '../types';
import { ReviewQueueTable } from '../components/review/ReviewQueueTable';
import { AgentTimeline } from '../components/agent/AgentTimeline';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const AgentActivityPage: React.FC = () => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<AgentTraceResponse | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({ page: 1, page_size: 50 });
      setJobs(res.items);
      if (res.items.length > 0 && !selectedJobId) {
        handleSelectJob(res.items[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    setTraceLoading(true);
    try {
      const tr = await api.getJobTrace(jobId);
      setSelectedTrace(tr);
    } catch (e) {
      console.error(e);
    } finally {
      setTraceLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Section: Human Review Authorization Queue */}
      <ReviewQueueTable jobs={jobs} onActionComplete={fetchJobs} />

      {/* Agent Jobs Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Jobs list */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs flex flex-col h-[700px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-navy-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold-500" />
                Orchestrator Runs ({jobs.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Select a run to inspect its tool timeline
              </p>
            </div>
            <button
              onClick={fetchJobs}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              title="Refresh runs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {loading ? (
              <LoadingSkeleton rows={6} />
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedJobId === job.id
                      ? 'border-gold-500 bg-gold-50/20 dark:bg-navy-700/80 shadow-xs'
                      : 'border-slate-200/80 dark:border-navy-700/60 hover:bg-slate-50 dark:hover:bg-navy-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {job.id.substring(0, 8)}...
                    </span>
                    <RiskBadge level={job.risk_level} score={job.risk_score} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {job.task_type}
                    </span>
                    <span>{new Date(job.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">
                    {job.input_preview || job.processing_purpose}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300">
                      {job.status}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {job.detections_count} entities
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected Job Timeline */}
        <div className="lg:col-span-7">
          {traceLoading ? (
            <LoadingSkeleton rows={8} />
          ) : selectedTrace ? (
            <div className="space-y-4">
              <AgentTimeline steps={selectedTrace.steps} />
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-navy-800/40 rounded-xl border border-slate-200 dark:border-navy-700 text-xs text-slate-400">
              Select a job to view its detailed timeline trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
