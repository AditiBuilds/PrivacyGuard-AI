import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'negative' | 'neutral' | 'warning';
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}) => {
  let badgeClasses = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  if (badge?.variant === 'positive') {
    badgeClasses = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400';
  } else if (badge?.variant === 'warning') {
    badgeClasses = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
  } else if (badge?.variant === 'negative') {
    badgeClasses = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
  }

  return (
    <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700/60 rounded-xl p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 bg-navy-900/5 dark:bg-navy-700/50 text-navy-900 dark:text-gold-500 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClasses}`}>
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
