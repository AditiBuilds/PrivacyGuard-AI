import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Scan,
  Upload,
  FileText,
  Table as TableIcon,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { ScanResponse, RedactResponse } from '../types';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { PiiFindingsTable } from '../components/scanner/PiiFindingsTable';
import { RedactionComparisonPanel } from '../components/scanner/RedactionComparisonPanel';

export const ScannerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [inputText, setInputText] = useState('');
  const [purpose, setPurpose] = useState('support_triage');
  const [actionChoice, setActionChoice] = useState<'scan' | 'redact' | 'prepare_ai'>('redact');
  const [loading, setLoading] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');

  // Results state
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [redactResult, setRedactResult] = useState<RedactResponse | null>(null);

  // Check if scenario passed via route navigation
  useEffect(() => {
    if (location.state?.scenario) {
      const sc = location.state.scenario;
      setInputText(sc.text);
      setPurpose(sc.purpose || 'support_triage');
      addToast('info', 'Scenario Loaded', `Loaded '${sc.title}'.`);
    }
  }, [location.state, addToast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);

    try {
      const parsed = await api.uploadFile(file);
      if (parsed.columns && parsed.columns.length > 0) {
        setCsvColumns(parsed.columns);
        setSelectedColumn(parsed.columns[0]);
        addToast('info', 'CSV Uploaded', `Select text column from ${parsed.columns.length} columns.`);
      } else {
        setInputText(parsed.text);
        setCsvColumns([]);
        addToast('success', 'File Loaded', `Loaded ${parsed.filename}`);
      }
    } catch (err: any) {
      addToast('error', 'Upload Error', err.message);
    }
  };

  const handleSelectCsvColumn = async (col: string) => {
    setSelectedColumn(col);
    if (!uploadFile) return;
    try {
      const parsed = await api.uploadFile(uploadFile, col);
      setInputText(parsed.text);
      addToast('success', 'Column Extracted', `Loaded ${parsed.rows_count} rows from '${col}'.`);
    } catch (err: any) {
      addToast('error', 'Extraction Failed', err.message);
    }
  };

  const handleExecuteScan = async () => {
    if (!inputText.trim()) {
      addToast('warning', 'Input Required', 'Please enter or upload text to scan.');
      return;
    }

    setLoading(true);
    try {
      if (actionChoice === 'prepare_ai') {
        // Navigate to Workspace with text & purpose
        navigate('/workspace', { state: { text: inputText, purpose } });
        return;
      }

      // Execute scan
      const scanRes = await api.scanText(inputText, purpose);
      setScanResult(scanRes);

      if (actionChoice === 'redact') {
        const redactRes = await api.redactText(inputText, purpose);
        setRedactResult(redactRes);
      } else {
        setRedactResult(null);
      }

      addToast('success', 'Scan Complete', `Detected ${scanRes.total_count} sensitive findings.`);
    } catch (err: any) {
      addToast('error', 'Scan Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Input Section Card */}
      <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-200 dark:border-navy-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-gold-500" />
              Privacy Scanner Input
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Input customer communications, support tickets, or workplace text for PII discovery and sanitization.
            </p>
          </div>

          {/* Purpose & Action Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Processing Purpose
              </label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-gold-500"
              >
                <option value="support_triage">Support Triage (Approved)</option>
                <option value="ticket_resolution">Ticket Resolution (Approved)</option>
                <option value="document_summary">Document Summary (Approved)</option>
                <option value="privacy_audit">Privacy Compliance Audit</option>
                <option value="marketing_profiling">Marketing Profiling (Unapproved - Policy Gated)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Desired Action
              </label>
              <select
                value={actionChoice}
                onChange={e => setActionChoice(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-gold-500"
              >
                <option value="redact">Scan & Redact (Recommended)</option>
                <option value="scan">Scan Only (No Masking)</option>
                <option value="prepare_ai">Transfer to AI Workspace</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-4">
          <div>
            <textarea
              rows={6}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste email, support inquiry, customer request, or workplace message here..."
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-gold-500 focus:outline-hidden transition"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
              <span>{inputText.length} characters</span>
              <span>Supported: Emails, Phones, IPs, Luhn Credit Cards, SSNs, Secrets, Names</span>
            </div>
          </div>

          {/* Upload & Run Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-navy-600 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload TXT or CSV</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {csvColumns.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">CSV Column:</span>
                  <select
                    value={selectedColumn}
                    onChange={e => handleSelectCsvColumn(e.target.value)}
                    className="px-2.5 py-1 rounded-md text-xs bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300 font-mono"
                  >
                    {csvColumns.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleExecuteScan}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-navy-900 dark:bg-gold-500 text-white dark:text-slate-950 hover:bg-navy-800 dark:hover:bg-gold-400 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Execute Privacy Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {scanResult && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-200">
          {/* Risk Summary Header Card */}
          <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Risk Assessment Summary
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {scanResult.risk_score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </span>
                  <RiskBadge level={scanResult.risk_level} score={scanResult.risk_score} />
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300">
                    Action: {scanResult.recommended_action}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Total Findings: <span className="font-bold text-slate-900 dark:text-white">{scanResult.total_count}</span>
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Human Review Required: <span className="font-semibold text-slate-700 dark:text-slate-300">{scanResult.human_review_required ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Reasons List */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:divide-navy-700/60 text-xs space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Triggered Policy Rationale:
              </span>
              {scanResult.human_readable_reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <span className="text-gold-500 font-bold">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Redaction Comparison Panel (If Redact chosen) */}
          {redactResult && (
            <RedactionComparisonPanel
              originalText={inputText}
              redactedText={redactResult.redacted_text}
              tokenMapping={redactResult.token_mapping}
            />
          )}

          {/* Findings Table */}
          <PiiFindingsTable findings={scanResult.findings} />
        </div>
      )}
    </div>
  );
};
