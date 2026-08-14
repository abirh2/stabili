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
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
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
    stabilized: "st-badge--positive",
    'health-good': "st-badge--positive",
    'health-fair': "st-badge--caution",
    'health-danger': "st-badge--negative",
    'health-unknown': "st-badge--neutral",
    violations: "st-badge--negative",
    'unit-count': "st-badge--neutral",
    verified: "st-badge--accent",
    neutral: "st-badge--neutral",
    'accent-teal': "st-badge--solid",
  };

  const renderedIcon = icon !== undefined ? icon : defaultIcons[variant];

  return (
    <span
      className={`st-badge select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
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

