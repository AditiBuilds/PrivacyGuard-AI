import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  level: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  score?: number;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showIcon = true }) => {
  const normLevel = level?.toLowerCase() || 'low';

  let bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
  let Icon = ShieldCheck;

  if (normLevel === 'medium') {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    Icon = AlertTriangle;
  } else if (normLevel === 'high') {
    bgClass = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800';
    Icon = AlertOctagon;
  } else if (normLevel === 'critical') {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    Icon = ShieldAlert;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgClass}`}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span className="capitalize">{level}</span>
      {score !== undefined && <span className="opacity-75 font-mono">({score})</span>}
    </span>
  );
};
