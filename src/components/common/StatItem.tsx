import React from 'react';

export interface StatItemProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'card' | 'row' | 'compact' | 'accent-teal';
  className?: string;
  valueClassName?: string;
  action?: React.ReactNode;
}

export const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'card',
  className = '',
  valueClassName = '',
  action,
}) => {
  if (variant === 'row') {
    return (
      <div className={`flex items-center justify-between py-2 border-b border-slate-100 last:border-0 ${className}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span className="text-xs text-slate-600 font-normal">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold text-slate-900 ${valueClassName}`}>{value}</span>
          {subtext && <span className="text-[11px] text-slate-400 font-normal">{subtext}</span>}
          {action}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
          {label}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          {icon && <span className="text-teal-600 shrink-0">{icon}</span>}
          <span className={`text-xs font-semibold text-slate-900 ${valueClassName}`}>{value}</span>
        </div>
        {subtext && <span className="text-[10px] text-slate-400 mt-0.5">{subtext}</span>}
      </div>
    );
  }

  // Default 'card' variant
  const variantBg = variant === 'accent-teal' 
    ? 'bg-teal-50/70 border-teal-200/80' 
    : 'bg-slate-50/80 border-slate-100';

  return (
    <div className={`p-3.5 rounded-xl border ${variantBg} ${className}`}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
          {label}
        </span>
        {action || (icon && <span className="text-slate-400 shrink-0">{icon}</span>)}
      </div>
      <div className={`text-xl font-bold tracking-tight text-slate-900 ${valueClassName}`}>
        {value}
      </div>
      {subtext && (
        <span className="text-[11px] text-slate-500 block mt-0.5 font-normal">
          {subtext}
        </span>
      )}
    </div>
  );
};
