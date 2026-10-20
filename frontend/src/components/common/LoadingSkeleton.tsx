import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse p-4">
      <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded-md w-3/4"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-slate-200 dark:bg-navy-700/60 rounded-md"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        ></div>
      ))}
    </div>
  );
};
