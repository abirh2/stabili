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
      badgeStyles: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
      iconColor: 'text-emerald-700',
      cardBorder: 'border-emerald-200/80 bg-emerald-50/50',
    },
    Fair: {
      label: 'Some concerns',
      shortLabel: 'Some concerns',
      description: 'Moderate open violation count or 311 maintenance reports under review.',
      icon: AlertTriangle,
      badgeStyles: 'bg-amber-50 text-amber-900 border-amber-200/70',
      iconColor: 'text-amber-700',
      cardBorder: 'border-amber-200/80 bg-amber-50/50',
    },
    'Needs Attention': {
      label: 'Higher concern',
      shortLabel: 'Higher concern',
      description: 'Elevated open municipal code violations or active Class C notices requiring inspection.',
      icon: AlertCircle,
      badgeStyles: 'bg-rose-50 text-rose-800 border-rose-200/70',
      iconColor: 'text-rose-700',
      cardBorder: 'border-rose-200/80 bg-rose-50/50',
    },
    'Not enough data': {
      label: 'Not enough data',
      shortLabel: 'Not enough data',
      description: 'Insufficient public municipal data to calculate a Stabili Building Health rating.',
      icon: HelpCircle,
      badgeStyles: 'bg-slate-100 text-slate-700 border-slate-200/80',
      iconColor: 'text-slate-500',
      cardBorder: 'border-slate-200/80 bg-slate-50/80',
    },
  }[currentHealth] || {
    label: 'Not enough data',
    shortLabel: 'Not enough data',
    description: 'Insufficient public municipal records available.',
    icon: HelpCircle,
    badgeStyles: 'bg-slate-100 text-slate-700 border-slate-200/80',
    iconColor: 'text-slate-500',
    cardBorder: 'border-slate-200/80 bg-slate-50/80',
  };

  const Icon = config.icon;

  if (variant === 'card') {
    return (
      <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${config.cardBorder} ${className}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-white ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 leading-tight">
            {config.label}
          </h4>
          {showDescription && (
            <span className="text-[11px] text-slate-500 block mt-0.5">
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
      className={`inline-flex items-center rounded-full font-medium border select-none whitespace-nowrap tracking-tight ${sizeStyles} ${config.badgeStyles} ${className}`}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
};

