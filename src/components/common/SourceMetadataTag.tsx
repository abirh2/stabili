import React from 'react';
import { Database, Landmark, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export interface SourceMetadataTagProps {
  source?: string;
  agency?: 'NYS HCR' | 'NYC HPD' | 'NYC DOB' | 'NYC Open Data' | string;
  className?: string;
  variant?: 'badge' | 'subtle' | 'inline';
}

export const SourceMetadataTag: React.FC<SourceMetadataTagProps> = ({
  source,
  agency = 'NYC Open Data',
  className = '',
  variant = 'badge',
}) => {
  const agencyLabel = source || agency;

  const iconMap: Record<string, React.ReactNode> = {
    'NYS HCR': <Landmark className="w-3 h-3 shrink-0" />,
    'NYS Homes and Community Renewal': <Landmark className="w-3 h-3 shrink-0" />,
    'NYC HPD': <ShieldCheck className="w-3 h-3 shrink-0" />,
    'NYC DOB': <Database className="w-3 h-3 shrink-0" />,
    'NYC Open Data': <FileSpreadsheet className="w-3 h-3 shrink-0" />,
  };

  const icon = iconMap[agencyLabel] || <Database className="w-3 h-3 shrink-0" />;

  if (variant === 'subtle') {
    return (
      <span className={`type-caption inline-flex items-center gap-1 ${className}`}>
        {icon}
        <span>Source: {agencyLabel}</span>
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`st-badge st-badge--neutral ${className}`}>
        {icon}
        <span>{agencyLabel}</span>
      </span>
    );
  }

  return (
    <span className={`st-badge st-badge--neutral select-none ${className}`}>
      {icon}
      <span>{agencyLabel}</span>
    </span>
  );
};
