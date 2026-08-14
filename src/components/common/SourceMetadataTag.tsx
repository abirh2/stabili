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
    'NYS HCR': <Landmark className="w-3 h-3 text-slate-500 shrink-0" />,
    'NYS Homes and Community Renewal': <Landmark className="w-3 h-3 text-slate-500 shrink-0" />,
    'NYC HPD': <ShieldCheck className="w-3 h-3 text-teal-600 shrink-0" />,
    'NYC DOB': <Database className="w-3 h-3 text-amber-600 shrink-0" />,
    'NYC Open Data': <FileSpreadsheet className="w-3 h-3 text-slate-500 shrink-0" />,
  };

  const icon = iconMap[agencyLabel] || <Database className="w-3 h-3 text-slate-400 shrink-0" />;

  if (variant === 'subtle') {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] text-slate-400 font-normal ${className}`}>
        {icon}
        <span>Source: {agencyLabel}</span>
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100/80 text-slate-600 border border-slate-200/60 ${className}`}>
        {icon}
        <span>{agencyLabel}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/70 select-none ${className}`}>
      {icon}
      <span>{agencyLabel}</span>
    </span>
  );
};
