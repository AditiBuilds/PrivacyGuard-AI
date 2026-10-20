import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Database,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Scan,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

export const TopNav: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { health, isOnline, setIsDemoModalOpen } = useApp();
  const location = useLocation();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Overview Dashboard', subtitle: 'Live operational privacy telemetry & metrics' };
      case '/scanner':
        return { title: 'Privacy Scanner', subtitle: 'Deterministic PII detection, Luhn validation & redaction' };
      case '/workspace':
        return { title: 'AI Workspace', subtitle: 'Bounded autonomous assistant with human-in-the-loop review' };
      case '/agent-activity':
        return { title: 'Agent Activity & Review', subtitle: 'Audit inspectable step execution timelines & approval queue' };
      case '/risk-analysis':
        return { title: 'Explainable Risk Analysis', subtitle: 'Deterministic rule weighting & policy triggers' };
      case '/analytics':
        return { title: 'Analytics & Benchmarks', subtitle: 'Mathematical evaluation metrics against synthetic ground-truth' };
      case '/audit-logs':
        return { title: 'Audit Trail', subtitle: 'Tamper-evident logs avoiding raw sensitive matches' };
      case '/settings':
        return { title: 'Privacy Settings', subtitle: 'Configure retention policies, thresholds & guardrails' };
      default:
        return { title: 'PrivacyGuard AI', subtitle: 'Privacy-aware decision support system' };
    }
  };

  const page = getPageInfo();

  return (
    <header className="h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          {page.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {page.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs">
          {isOnline && health?.database_connected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">System Healthy</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-medium text-rose-600 dark:text-rose-400">Backend Offline</span>
            </>
          )}
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Database className="w-3 h-3 text-gold-500" />
            SQLite
          </span>
        </div>

        {/* Quick Action: New Scan */}
        <Link
          to="/scanner"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition shadow-xs"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Scan Text</span>
        </Link>

        {/* Demo Data Control */}
        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 transition"
          title="Manage synthetic demo data scenarios"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          <span>Demo Data</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 transition"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-gold-400" />}
        </button>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-navy-700 text-xs">
          <div className="w-7 h-7 rounded-full bg-navy-800 dark:bg-gold-500/20 text-gold-400 font-semibold flex items-center justify-center border border-navy-700 dark:border-gold-500/30">
            <UserCheck className="w-4 h-4 text-gold-500" />
          </div>
          <div className="hidden lg:block text-left">
            <span className="block font-semibold text-slate-800 dark:text-slate-200 text-xs leading-tight">Privacy Officer</span>
            <span className="block text-[10px] text-slate-400">Local Analyst</span>
          </div>
        </div>
      </div>
    </header>
  );
};
