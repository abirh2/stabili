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
      <div className={`separator flex items-center justify-between py-2.5 border-b last:border-0 ${className}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-tertiary shrink-0">{icon}</span>}
          <span className="type-metadata">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`type-label text-primary ${valueClassName}`}>{value}</span>
          {subtext && <span className="type-caption">{subtext}</span>}
          {action}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="type-caption block">
          {label}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          {icon && <span className="text-accent shrink-0">{icon}</span>}
          <span className={`type-label text-primary ${valueClassName}`}>{value}</span>
        </div>
        {subtext && <span className="type-caption mt-0.5">{subtext}</span>}
      </div>
    );
  }

  // Default 'card' variant
  const variantBg = variant === 'accent-teal' ? 'bg-[var(--st-accent-subtle)]' : '';

  return (
    <div className={`separator border-t py-3 ${variantBg} ${className}`}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="type-caption block">
          {label}
        </span>
        {action || (icon && <span className="text-tertiary shrink-0">{icon}</span>)}
      </div>
      <div className={`text-lg font-semibold tracking-[-0.018em] text-primary tabular-nums ${valueClassName}`}>
        {value}
      </div>
      {subtext && (
        <span className="type-caption block mt-0.5">
          {subtext}
        </span>
      )}
    </div>
  );
};
