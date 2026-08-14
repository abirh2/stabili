import React from 'react';

export interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  badge,
  className = '',
  size = 'md',
}) => {
  const titleSizes = {
    sm: 'type-building-title',
    md: 'type-section-title',
    lg: 'type-section-title sm:!text-2xl',
  }[size];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="h-6 w-6 text-accent flex items-center justify-center shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={titleSizes}>{title}</h2>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {subtitle && (
            <p className="type-metadata mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
