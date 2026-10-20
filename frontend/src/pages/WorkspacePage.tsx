import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  FileText,
  Tag,
  CheckSquare,
  ShieldCheck,
  Send,
  RefreshCw,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { ProcessingJob, AgentTraceResponse } from '../types';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { AgentTimeline } from '../components/agent/AgentTimeline';
import { RedactionComparisonPanel } from '../components/scanner/RedactionComparisonPanel';

export const WorkspacePage: React.FC = () => {
  const location = useLocation();
  const { addToast } = useApp();

  const [taskType, setTaskType] = useState('summarize');
  const [inputText, setInputText] = useState('');
  const [purpose, setPurpose] = useState('support_triage');
  const [processingMode, setProcessingMode] = useState('deterministic');
  const [loading, setLoading] = useState(false);

  // Current active job & trace
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);
  const [trace, setTrace] = useState<AgentTraceResponse | null>(null);

  useEffect(() => {
    if (location.state?.text) {
      setInputText(location.state.text);
      if (location.state.purpose) setPurpose(location.state.purpose);
    } else if (location.state?.scenario) {
      const sc = location.state.scenario;
      setInputText(sc.text);
      setPurpose(sc.purpose || 'support_triage');
      if (sc.task_type) setTaskType(sc.task_type);
      addToast('info', 'Scenario Loaded', `Loaded '${sc.title}'.`);
    }
  }, [location.state, addToast]);

  const handleRunWorkflow = async () => {
    if (!inputText.trim()) {
      addToast('warning', 'Input Text Required', 'Please enter text for the AI task.');
      return;
    }

    setLoading(true);
    try {
      const job = await api.createJob({
        task_type: taskType,
        text: inputText,
        processing_purpose: purpose,
        processing_mode: processingMode,
        auto_execute: true,
      });

      setActiveJob(job);
      const tr = await api.getJobTrace(job.id);
      setTrace(tr);

      if (job.status === 'pending_review') {
        addToast('warning', 'Human Review Required', 'Task paused for human sign-off due to policy risk score.');
      } else if (job.status === 'rejected') {
        addToast('error', 'Task Blocked', 'Blocked by policy or prompt injection filter.');
      } else {
        addToast('success', 'Workflow Completed', `Task completed with ${job.risk_score} risk score.`);
      }
    } catch (e: any) {
      addToast('error', 'Execution Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const job = await api.approveJob(activeJob.id, 'Approved in AI Workspace');
      setActiveJob(job);
      const tr = await api.getJobTrace(job.id);
      setTrace(tr);
      addToast('success', 'Job Approved', 'Downstream task completed.');
    } catch (e: any) {
      addToast('error', 'Approval Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const job = await api.rejectJob(activeJob.id, 'Rejected in AI Workspace');
      setActiveJob(job);
      const tr = await api.getJobTrace(job.id);
      setTrace(tr);
      addToast('info', 'Job Rejected', 'Execution halted permanently.');
    } catch (e: any) {
      addToast('error', 'Rejection Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!activeJob?.result_json) return;
    const blob = new Blob([activeJob.result_json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacyguard_task_${activeJob.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Result Exported', 'Task output JSON downloaded.');
  };

  let parsedResult: any = null;
  if (activeJob?.result_json) {
    try {
      parsedResult = JSON.parse(activeJob.result_json);
    } catch {
      parsedResult = activeJob.result_json;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Workspace Configuration Card */}
      <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-navy-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-gold-500" />
              Bounded AI Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autonomous agent orchestrates tools: detect PII → assess risk → redact → approval gate → execute task → validate output.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                AI Task Type
              </label>
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-semibold focus:ring-1 focus:ring-gold-500"
              >
                <option value="summarize">Summarize Support Ticket</option>
                <option value="classify">Classify Customer Request</option>
                <option value="action_items">Extract Non-Sensitive Actions</option>
                <option value="privacy_report">Generate Privacy Assessment Report</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Processing Purpose
              </label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-gold-500"
              >
                <option value="support_triage">Support Triage</option>
                <option value="ticket_resolution">Ticket Resolution</option>
                <option value="document_summary">Document Summary</option>
                <option value="privacy_audit">Privacy Compliance Audit</option>
                <option value="marketing_profiling">Marketing Profiling (Policy Blocked)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Execution Mode
              </label>
              <select
                value={processingMode}
                onChange={e => setProcessingMode(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-gold-500"
              >
                <option value="deterministic">Deterministic Local NLP (Fast)</option>
                <option value="ollama">Ollama Local LLM (if installed)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-4">
          <textarea
            rows={5}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Enter customer message, inquiry, or incident log to process with bounded AI agent..."
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-gold-500 focus:outline-hidden transition"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Never transmits unredacted text to external destinations. Strict local execution.
            </span>

            <button
              onClick={handleRunWorkflow}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition shadow-sm disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Orchestrating...' : 'Run Agent Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Execution Results View */}
      {activeJob && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-200">
          {/* Status & Approval Gate Card */}
          <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Job ID: {activeJob.id}</span>
                  <span>•</span>
                  <span>Mode: {activeJob.processing_mode}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                    {activeJob.task_type} Result
                  </h4>
                  <RiskBadge level={activeJob.risk_level} score={activeJob.risk_score} />
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 capitalize">
                    Status: {activeJob.status}
                  </span>
                </div>
              </div>

              {/* Human Approval Action Controls (If Paused) */}
              {activeJob.status === 'pending_review' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                  <div className="text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block">
                      Human Authorization Required
                    </span>
                    <span className="text-amber-700 dark:text-amber-400">
                      Score ({activeJob.risk_score}) triggered review threshold.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition"
                    >
                      Approve & Execute
                    </button>
                  </div>
                </div>
              )}

              {activeJob.status === 'completed' && (
                <button
                  onClick={handleDownloadResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              )}
            </div>
          </div>

          {/* Structured Output Card */}
          {parsedResult && activeJob.status === 'completed' && (
            <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-6 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Structured AI Model Output
              </h4>

              {/* Summarize view */}
              {parsedResult.summary && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Executive Context Summary:
                  </span>
                  <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {parsedResult.summary}
                  </div>
                </div>
              )}

              {/* Classify view */}
              {parsedResult.category && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Primary Category</span>
                    <span className="block text-sm font-bold text-navy-900 dark:text-gold-400 mt-1">
                      {parsedResult.category}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Assessed Priority</span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {parsedResult.priority || 'Medium'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Rationale</span>
                    <span className="block text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {parsedResult.reasoning || parsedResult.details || 'Keyword match'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action items view */}
              {parsedResult.action_items && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Extracted Action Items:
                  </span>
                  <ul className="space-y-1.5 p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 text-xs">
                    {parsedResult.action_items.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Privacy report view */}
              {parsedResult.report_markdown && (
                <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {parsedResult.report_markdown}
                </div>
              )}
            </div>
          )}

          {/* Redacted Text Preview */}
          {activeJob.redacted_output && (
            <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Redacted Document Context Fed to Model
              </span>
              <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg border border-slate-200/80 dark:border-navy-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto">
                {activeJob.redacted_output}
              </div>
            </div>
          )}

          {/* Agent Execution Timeline */}
          {trace && <AgentTimeline steps={trace.steps} />}
        </div>
      )}
    </div>
  );
};
