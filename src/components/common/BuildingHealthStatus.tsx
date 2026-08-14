import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { BuildingHealth } from '../../types';

export interface BuildingHealthStatusProps {
  health?: BuildingHealth | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'card' | 'inline';
  className?: string;
  showDescription?: boolean;
}

export const BuildingHealthStatus: React.FC<BuildingHealthStatusProps> = ({
  health = 'Not enough data',
  size = 'md',
  variant = 'badge',
  className = '',
  showDescription = false,
}) => {
  const currentHealth: BuildingHealth = (health as BuildingHealth) || 'Not enough data';

  const config = {
    Good: {
      label: 'Low concern',
      shortLabel: 'Low concern',
      description: 'Low open violation activity on municipal record; minimal HPD items.',
      icon: CheckCircle2,
      badgeStyles: 'st-badge--positive',
      iconColor: 'text-[var(--st-positive)]',
      cardBorder: 'bg-[var(--st-positive-subtle)]',
    },
    Fair: {
      label: 'Some concerns',
      shortLabel: 'Some concerns',
      description: 'Moderate open violation count or 311 maintenance reports under review.',
      icon: AlertTriangle,
      badgeStyles: 'st-badge--caution',
      iconColor: 'text-[var(--st-caution)]',
      cardBorder: 'bg-[var(--st-caution-subtle)]',
    },
    'Needs Attention': {
      label: 'Higher concern',
      shortLabel: 'Higher concern',
      description: 'Elevated open municipal code violations or active Class C notices requiring inspection.',
      icon: AlertCircle,
      badgeStyles: 'st-badge--negative',
      iconColor: 'text-[var(--st-negative)]',
      cardBorder: 'bg-[var(--st-negative-subtle)]',
    },
    'Not enough data': {
      label: 'Not enough data',
      shortLabel: 'Not enough data',
      description: 'Insufficient public municipal data to calculate a Stabili Building Health rating.',
      icon: HelpCircle,
      badgeStyles: 'st-badge--neutral',
      iconColor: 'text-secondary',
      cardBorder: 'surface-muted',
    },
  }[currentHealth] || {
    label: 'Not enough data',
    shortLabel: 'Not enough data',
    description: 'Insufficient public municipal records available.',
    icon: HelpCircle,
    badgeStyles: 'st-badge--neutral',
    iconColor: 'text-secondary',
    cardBorder: 'surface-muted',
  };

  const Icon = config.icon;

  if (variant === 'card') {
    return (
      <div className={`radius-control flex items-center gap-3 p-3.5 ${config.cardBorder} ${className}`}>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="type-label text-primary">
            Stabili summary · {config.label}
          </h4>
          {showDescription && (
            <span className="type-caption block mt-0.5">
              {config.description}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.iconColor} ${className}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{size === 'sm' ? config.shortLabel : config.label}</span>
      </span>
    );
  }

  // Default 'badge' variant
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`st-badge select-none ${sizeStyles} ${config.badgeStyles} ${className}`}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
};
