import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, RefreshCw, Trash2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DemoScenario } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const DemoModal: React.FC = () => {
  const { isDemoModalOpen, setIsDemoModalOpen, addToast, refreshHealth } = useApp();
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDemoModalOpen) {
      api.getDemoScenarios().then(setScenarios).catch(() => {});
    }
  }, [isDemoModalOpen]);

  if (!isDemoModalOpen) return null;

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      const res = await api.loadDemoData();
      addToast('success', 'Demo Dataset Loaded', res.message);
      await refreshHealth();
      setIsDemoModalOpen(false);
    } catch (e: any) {
      addToast('error', 'Failed to Load Demo', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setShowConfirmReset(false);
    setLoading(true);
    try {
      const res = await api.resetDemoData();
      addToast('info', 'Demo Data Reset', res.message);
      await refreshHealth();
      setIsDemoModalOpen(false);
    } catch (e: any) {
      addToast('error', 'Reset Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = (sc: DemoScenario, target: 'scanner' | 'workspace') => {
    setIsDemoModalOpen(false);
    navigate(`/${target}`, { state: { scenario: sc } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-navy-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold-500/10 text-gold-500 rounded-xl border border-gold-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Demonstration Data & Test Scenarios
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% synthetic, fictional support messages with zero real personal information.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 dark:bg-navy-950/60 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Initialize / Reload Demo Data</span>
            </button>
          </div>
          <button
            onClick={() => setShowConfirmReset(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Demo Records</span>
          </button>
        </div>

        {/* Scenarios List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Available Test Scenarios ({scenarios.length})
          </h4>
          <div className="grid gap-2.5">
            {scenarios.map(sc => (
              <div
                key={sc.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-800/40 hover:border-gold-500/50 transition flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {sc.title}
                    </span>
                    <RiskBadge level={sc.expected_risk} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSelectScenario(sc, 'scanner')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition flex items-center gap-1"
                    >
                      <span>Scanner</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSelectScenario(sc, 'workspace')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition flex items-center gap-1"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sc.description}
                </p>
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-navy-950/60 p-2 rounded-lg border border-slate-100 dark:border-navy-800/60 truncate">
                  "{sc.text}"
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmReset}
        title="Reset Demo Records?"
        message="This action will delete all synthetic processing jobs, PII detections, and evaluation metrics. It cannot be undone."
        confirmLabel="Reset All Demo Data"
        isDestructive={true}
        onConfirm={handleResetDemo}
        onCancel={() => setShowConfirmReset(false)}
      />
    </div>
  );
};
