import React from 'react';
import { AgentStep } from '../../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  PauseCircle,
  Cpu,
  Shield,
  Bot,
} from 'lucide-react';

interface AgentTimelineProps {
  steps: AgentStep[];
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ steps }) => {
  if (steps.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-navy-800/40 rounded-xl border border-slate-200 dark:border-navy-700">
        No agent execution steps recorded for this task.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800/80 rounded-xl border border-slate-200 dark:border-navy-700 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-gold-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Bounded Agent Execution Trace ({steps.length} Steps)
          </h4>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Max 8 Tool Steps Policy Enforced
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-navy-700">
        {steps.map(step => {
          let StatusIcon = CheckCircle2;
          let iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60';
          let borderClass = 'border-slate-200 dark:border-navy-700';

          if (step.status === 'blocked' || step.status === 'failed') {
            StatusIcon = XCircle;
            iconColor = 'text-rose-500 bg-rose-50 dark:bg-rose-950/60';
            borderClass = 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20';
          } else if (step.status === 'paused') {
            StatusIcon = PauseCircle;
            iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/60';
            borderClass = 'border-amber-200 dark:border-amber-900/40 bg-amber-50/20';
          }

          return (
            <div key={step.step_number} className="relative group">
              {/* Step indicator dot */}
              <div
                className={`absolute -left-[30px] top-1 p-1 rounded-full border border-slate-200 dark:border-navy-700 ${iconColor} z-10`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
              </div>

              <div className={`p-4 rounded-xl border bg-slate-50/50 dark:bg-navy-900/40 ${borderClass} transition hover:shadow-xs`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      #{step.step_number}
                    </span>
                    <span className="text-xs font-semibold font-mono text-navy-900 dark:text-gold-400 bg-navy-100/60 dark:bg-navy-800 px-2 py-0.5 rounded-md">
                      {step.tool_name}
                    </span>
                    <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded-full text-slate-500 bg-slate-200/60 dark:bg-navy-700 dark:text-slate-300">
                      {step.status}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    {step.duration_ms} ms
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {step.reason}
                </p>

                {step.result_summary && (
                  <div className="mt-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-navy-950/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-navy-800/80">
                    {step.result_summary}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
