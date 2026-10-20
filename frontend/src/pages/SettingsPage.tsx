import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Trash2,
  Save,
  Cpu,
  RefreshCw,
  HardDrive,
  Info,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { PrivacySettings, LLMHealthStatus } from '../types';
import { useApp } from '../context/AppContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [llmHealth, setLlmHealth] = useState<LLMHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const { addToast, refreshHealth } = useApp();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([api.getSettings(), api.getLLMHealth()]);
      setSettings(s);
      setLlmHealth(l);
    } catch (e: any) {
      addToast('error', 'Failed to Load Settings', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      await refreshHealth();
      addToast('success', 'Settings Saved', 'Backend privacy policies and thresholds updated.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRetentionCleanup = async () => {
    setShowCleanupConfirm(false);
    setCleaning(true);
    try {
      const res = await api.cleanupRetention();
      addToast('success', 'Retention Cleanup Complete', res.message);
      await refreshHealth();
    } catch (err: any) {
      addToast('error', 'Cleanup Failed', err.message);
    } finally {
      setCleaning(false);
    }
  };

  if (loading && !settings) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Privacy Policies */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-200 dark:border-navy-700">
            <Shield className="w-5 h-5 text-gold-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Privacy Policies & Guardrails
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enforced by backend validation rules on every incoming document.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Local Only Processing Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Strict Local-Only Processing Preference
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Blocks any request attempting to route document contents outside localhost.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.local_only_processing ?? true}
                  onChange={e => setSettings(s => s ? { ...s, local_only_processing: e.target.checked } : null)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-900 dark:peer-checked:bg-gold-500"></div>
              </label>
            </div>

            {/* Redaction Strategy */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Default Redaction Masking Strategy
              </label>
              <select
                value={settings?.default_redaction_strategy || 'token'}
                onChange={e => setSettings(s => s ? { ...s, default_redaction_strategy: e.target.value } : null)}
                className="w-full p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="token">Stable Replacement Tokens ([EMAIL_1], [PERSON_1]) — Preserves context</option>
                <option value="mask">Generic Redaction ([REDACTED_EMAIL], [REDACTED_PERSON])</option>
              </select>
            </div>

            {/* Review Threshold Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white mb-1">
                <span>Human Review Trigger Threshold</span>
                <span className="font-mono text-gold-600 dark:text-gold-400">{settings?.human_review_threshold ?? 60} pts</span>
              </div>
              <input
                type="range"
                min={20}
                max={90}
                value={settings?.human_review_threshold ?? 60}
                onChange={e => setSettings(s => s ? { ...s, human_review_threshold: parseInt(e.target.value) } : null)}
                className="w-full accent-gold-500"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Jobs with risk score ≥ this threshold pause for reviewer sign-off before AI processing.
              </span>
            </div>

            {/* Retention Period Days */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Configured Retention Window (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={settings?.retention_days ?? 30}
                onChange={e => setSettings(s => s ? { ...s, retention_days: parseInt(e.target.value) || 30 } : null)}
                className="w-full p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-mono"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Records older than this duration are pruned during automated or manual retention cleanup.
              </span>
            </div>
          </div>
        </div>

        {/* AI & Local LLM Provider Settings */}
        <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-200 dark:border-navy-700">
            <Cpu className="w-5 h-5 text-gold-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Local LLM & Model Engine Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optional local Ollama instance or zero-dependency deterministic NLP fallback.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                AI Provider Mode
              </label>
              <select
                value={settings?.llm_provider || 'deterministic'}
                onChange={e => setSettings(s => s ? { ...s, llm_provider: e.target.value } : null)}
                className="w-full p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="deterministic">Deterministic Local NLP (Built-in, No LLM required)</option>
                <option value="ollama">Ollama (Local Private LLM)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={settings?.ollama_base_url || 'http://localhost:11434'}
                  onChange={e => setSettings(s => s ? { ...s, ollama_base_url: e.target.value } : null)}
                  className="w-full p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ollama Model Tag
                </label>
                <input
                  type="text"
                  value={settings?.ollama_model || 'llama3.2'}
                  onChange={e => setSettings(s => s ? { ...s, ollama_model: e.target.value } : null)}
                  className="w-full p-2.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Ollama Status Diagnostic Box */}
            <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Ollama Health Diagnostic:
                </span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${llmHealth?.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-300'}`}>
                  {llmHealth?.available ? 'ONLINE' : 'OFFLINE / UNREACHABLE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {llmHealth?.message}
              </p>
              {!llmHealth?.available && (
                <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-900 p-2.5 rounded border border-slate-200 dark:border-navy-800">
                  <span className="font-bold block mb-1">Optional Ollama Setup:</span>
                  1. Download Ollama from <code className="bg-slate-100 dark:bg-navy-950 px-1 py-0.5 rounded">https://ollama.com</code><br />
                  2. Pull model: <code className="bg-slate-100 dark:bg-navy-950 px-1 py-0.5 rounded">ollama run llama3.2</code><br />
                  3. If Ollama is not running, PrivacyGuard automatically uses its built-in deterministic NLP engine.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Privacy Settings'}</span>
          </button>
        </div>
      </form>

      {/* Explicit Retention Cleanup Service Section */}
      <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-navy-700">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-rose-500" />
              Data Retention & Minimization Service
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prunes historical processing jobs and PII records older than {settings?.retention_days ?? 30} days.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCleanupConfirm(true)}
            disabled={cleaning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{cleaning ? 'Cleaning...' : 'Execute Retention Cleanup Now'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Security audit logs maintain minimal tamper-evident action events while unlinking deleted documents.
        </p>
      </div>

      <ConfirmationModal
        isOpen={showCleanupConfirm}
        title="Execute Retention Cleanup?"
        message={`This will permanently delete all stored processing jobs and PII findings created older than ${settings?.retention_days ?? 30} days.`}
        confirmLabel="Execute Pruning"
        isDestructive={true}
        onConfirm={handleRetentionCleanup}
        onCancel={() => setShowCleanupConfirm(false)}
      />
    </div>
  );
};
