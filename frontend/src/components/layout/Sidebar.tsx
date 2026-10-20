import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanEye,
  Bot,
  Activity,
  ShieldCheck,
  BarChart3,
  ScrollText,
  Sliders,
  Shield,
  Cpu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { llmHealth } = useApp();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/scanner', label: 'Privacy Scanner', icon: ScanEye },
    { to: '/workspace', label: 'AI Workspace', icon: Bot },
    { to: '/agent-activity', label: 'Agent Activity', icon: Activity },
    { to: '/risk-analysis', label: 'Risk Analysis', icon: ShieldCheck },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/settings', label: 'Privacy Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-800 text-slate-300 flex flex-col shrink-0 select-none">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-navy-800">
        <div className="p-2 bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 rounded-lg shadow-sm">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-white tracking-tight">PrivacyGuard</span>
            <span className="text-xs px-1.5 py-0.5 rounded-sm bg-gold-500/20 text-gold-400 font-semibold border border-gold-500/30">AI</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Privacy-Aware Intelligence</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Core Workflows
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-navy-800 text-white font-semibold shadow-xs border-l-2 border-gold-500'
                    : 'text-slate-300 hover:bg-navy-800/60 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-gold-400" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Local Processing Status Footer */}
      <div className="p-4 border-t border-navy-800/80 bg-navy-950/40">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-gold-500" />
            Execution Engine
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-950/80 text-emerald-400 font-mono border border-emerald-800/60">
            LOCAL
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate" title={llmHealth?.message || 'Deterministic local NLP active'}>
          {llmHealth?.available ? `Ollama (${llmHealth.model})` : 'Deterministic NLP Engine'}
        </p>
        <div className="mt-2 text-[10px] text-slate-400">
          Zero external data leakage.
        </div>
      </div>
    </aside>
  );
};
