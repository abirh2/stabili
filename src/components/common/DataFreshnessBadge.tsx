import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

export interface DataFreshnessBadgeProps {
  date?: string;
  updatedLabel?: string;
  className?: string;
  variant?: 'badge' | 'subtle' | 'inline';
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  date,
  updatedLabel,
  className = '',
  variant = 'badge',
}) => {
  const displayText = updatedLabel || (date ? `Public record retrieved ${date}` : 'Update date unavailable');

  if (variant === 'subtle') {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] text-slate-400 font-normal ${className}`}>
        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
        <span>{displayText}</span>
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100/90 text-slate-600 border border-slate-200/70 ${className}`}>
        <RefreshCw className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        <span>{displayText}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200/80 ${className}`}>
      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
      <span>{displayText}</span>
    </span>
  );
};
