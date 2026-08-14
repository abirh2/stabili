import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Check } from 'lucide-react';
import { BuildingHealth } from '../../types';

export type BadgeVariant = 
  | 'stabilized' 
  | 'health-good' 
  | 'health-fair' 
  | 'health-danger' 
  | 'health-unknown'
  | 'violations' 
  | 'unit-count' 
  | 'verified' 
  | 'neutral'
  | 'accent-teal';

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'stabilized',
  children,
  icon,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: "text-[11px] font-medium px-2 py-0.5 gap-1",
    md: "text-xs font-medium px-2.5 py-0.5 gap-1.5",
  };

  const defaultIcons: Partial<Record<BadgeVariant, React.ReactNode>> = {
    stabilized: <ShieldCheck className="w-3.5 h-3.5" />,
    'health-good': <CheckCircle2 className="w-3.5 h-3.5" />,
    'health-fair': <AlertTriangle className="w-3.5 h-3.5" />,
    'health-danger': <AlertCircle className="w-3.5 h-3.5" />,
    'health-unknown': <HelpCircle className="w-3.5 h-3.5" />,
    violations: <AlertTriangle className="w-3.5 h-3.5" />,
    verified: <Check className="w-3 h-3 stroke-[2.5]" />,
  };

  const variantStyles: Record<BadgeVariant, string> = {
    stabilized: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
    'health-good': "bg-teal-50 text-teal-800 border border-teal-200/60",
    'health-fair': "bg-amber-50 text-amber-800 border border-amber-200/60",
    'health-danger': "bg-rose-50 text-rose-800 border border-rose-200/60",
    'health-unknown': "bg-slate-100 text-slate-700 border border-slate-200/80",
    violations: "bg-rose-50 text-rose-800 border border-rose-200/60",
    'unit-count': "bg-slate-100 text-slate-700 border border-slate-200/70",
    verified: "bg-teal-50 text-teal-800 border border-teal-200/60",
    neutral: "bg-slate-100/80 text-slate-600 border border-slate-200/60",
    'accent-teal': "bg-teal-600 text-white shadow-xs",
  };

  const renderedIcon = icon !== undefined ? icon : defaultIcons[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full select-none whitespace-nowrap tracking-tight ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {renderedIcon && <span className="shrink-0">{renderedIcon}</span>}
      {children}
    </span>
  );
};

export const BuildingHealthBadge: React.FC<{ health?: BuildingHealth | null; className?: string }> = ({
  health,
  className = '',
}) => {
  if (health === 'Good') {
    return <Badge variant="health-good" className={className}>Low concern</Badge>;
  }
  if (health === 'Fair') {
    return <Badge variant="health-fair" className={className}>Some concerns</Badge>;
  }
  if (health === 'Needs Attention') {
    return <Badge variant="health-danger" className={className}>Higher concern</Badge>;
  }
  return <Badge variant="health-unknown" className={className}>Not enough data</Badge>;
};


