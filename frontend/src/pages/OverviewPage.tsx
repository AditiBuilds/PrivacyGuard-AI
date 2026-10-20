import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldAlert,
  ScanEye,
  Percent,
  Clock,
  UserCheck,
  Cpu,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary, DashboardTrends, ProcessingJob, AuditLog } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

const PIE_COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444', '#6366F1'];

export const OverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [recentJobs, setRecentJobs] = useState<ProcessingJob[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sum, tr, jb, ad] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardTrends(),
        api.getJobs({ page: 1, page_size: 5 }),
        api.getAuditLogs(1, 5),
      ]);
      setSummary(sum);
      setTrends(tr);
      setRecentJobs(jb.items);
      setRecentAudits(ad.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !summary) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Local LLM / Engine Status Banner */}
      <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-navy-900/5 dark:bg-navy-700 text-gold-500 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                AI Orchestrator Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                LOCAL ONLY
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
              Provider: <span className="font-mono font-semibold">{summary?.llm_provider}</span> — {summary?.llm_available ? `Ollama local model '${summary?.llm_model}' connected.` : 'Deterministic NLP Fallback active (Zero external API dependencies).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/workspace"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition flex items-center gap-1.5"
          >
            <span>Open AI Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Documents"
          value={summary?.total_documents ?? 0}
          subtitle="Processed to date"
          icon={FileText}
        />
        <KpiCard
          title="PII Entities"
          value={summary?.total_pii_detected ?? 0}
          subtitle="Detected & cataloged"
          icon={ScanEye}
        />
        <KpiCard
          title="High Risk Jobs"
          value={summary?.high_risk_jobs ?? 0}
          subtitle="Score >= 60"
          icon={ShieldAlert}
          badge={{ text: 'Gated', variant: 'warning' }}
        />
        <KpiCard
          title="Redaction Rate"
          value={`${summary?.redaction_rate ?? 100}%`}
          subtitle="Entities sanitized"
          icon={Percent}
          badge={{ text: '100% Target', variant: 'positive' }}
        />
        <KpiCard
          title="Pending Reviews"
          value={summary?.pending_reviews ?? 0}
          subtitle="Awaiting human sign-off"
          icon={UserCheck}
          badge={summary?.pending_reviews ? { text: 'Action Needed', variant: 'negative' } : undefined}
        />
        <KpiCard
          title="Avg Latency"
          value={`${summary?.avg_processing_time_ms ?? 0}ms`}
          subtitle="Fast local execution"
          icon={Clock}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Volume Trend */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Processing Volume Over Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                7-day operational document volume
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-gold-500" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.volume_trend || []}>
                <defs>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9AE57" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D9AE57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101B32', borderColor: '#233558', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#D9AE57" strokeWidth={2} fillOpacity={1} fill="url(#volGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PII Findings by Category */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                PII Detections by Entity Type
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Frequency distribution of identified sensitive categories
              </p>
            </div>
            <ScanEye className="w-4 h-4 text-sky-500" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.pii_by_type || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101B32', borderColor: '#233558', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#182641" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Risk Classification Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Low, Medium, High, and Critical risk categorization
              </p>
            </div>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trends?.risk_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  label={({ name, count }) => `${name} (${count})`}
                  labelLine={false}
                >
                  {(trends?.risk_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#101B32', borderColor: '#233558', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Statuses */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Processing Job Outcomes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Completed, Pending Review, Approved & Rejected status counts
              </p>
            </div>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.status_distribution || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101B32', borderColor: '#233558', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#D9AE57" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Processing Jobs & Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Processing Jobs
            </h3>
            <Link to="/agent-activity" className="text-xs font-medium text-navy-800 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
            {recentJobs.map(j => (
              <div key={j.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {j.id.substring(0, 8)}...
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {j.task_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                    {j.input_preview || j.processing_purpose}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={j.risk_level} score={j.risk_score} />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 capitalize">
                    {j.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Audit Events */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Latest Audit Events
            </h3>
            <Link to="/audit-logs" className="text-xs font-medium text-navy-800 dark:text-gold-400 hover:underline">
              View All Logs
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
            {recentAudits.map(a => (
              <div key={a.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {a.action}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>Actor: {a.actor}</span>
                    <span>•</span>
                    <span>{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-navy-700/60 px-2 py-1 rounded text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                  {a.metadata_json || '{}'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
