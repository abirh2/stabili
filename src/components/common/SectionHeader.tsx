import React from 'react';

export interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  icon,
  action,
  badge,
  className = '',
  size = 'md',
}) => {
  const titleSizes = {
    sm: 'text-base font-semibold tracking-tight text-slate-900',
    md: 'text-lg font-semibold tracking-tight text-slate-900',
    lg: 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900',
  }[size];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div>
          {eyebrow && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-teal-800 block mb-0.5">
              {eyebrow}
            </span>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={titleSizes}>{title}</h2>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
