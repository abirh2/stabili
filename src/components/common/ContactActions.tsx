import React, { useState } from 'react';
import { Phone, Mail, Globe, Copy, Check, ExternalLink } from 'lucide-react';

export interface ContactActionsProps {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  businessMailingAddress?: string | null;
  variant?: 'tiles' | 'pills' | 'compact' | 'buttons';
  className?: string;
  subject?: string;
  onToast?: (message: string) => void;
  emptyStateText?: string;
}

export const ContactActions: React.FC<ContactActionsProps> = ({
  phone,
  email,
  website,
  address,
  businessMailingAddress,
  variant = 'tiles',
  className = '',
  subject,
  onToast,
  emptyStateText = "Management contact information was not available in the current public record.",
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    if (onToast) {
      onToast(`Copied ${label} to clipboard`);
    }
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const hasDirectContact = Boolean(phone || email || website);
  const mailingAddressToUse = address || businessMailingAddress;

  if (!hasDirectContact && !mailingAddressToUse) {
    return (
      <div className={`p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs text-slate-500 font-normal leading-relaxed ${className}`}>
        {emptyStateText}
      </div>
    );
  }

  const mailtoUrl = email 
    ? `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}` 
    : undefined;

  const webUrl = website 
    ? (website.startsWith('http') ? website : `https://${website}`) 
    : undefined;

  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {phone && (
          <a
            href={`tel:${phone.replace(/[^0-9]/g, '')}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Phone className="w-3 h-3 text-teal-600 shrink-0" />
            <span>{phone}</span>
          </a>
        )}
        {email && (
          <a
            href={mailtoUrl}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Mail className="w-3 h-3 text-teal-600 shrink-0" />
            <span className="truncate max-w-[140px]">{email}</span>
          </a>
        )}
        {website && (
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Globe className="w-3 h-3 text-teal-600 shrink-0" />
            <span className="truncate max-w-[120px]">{website}</span>
          </a>
        )}
        {!phone && !email && businessMailingAddress && (
          <button
            type="button"
            onClick={() => handleCopy(businessMailingAddress, 'mailing', 'mailing address')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {copiedKey === 'mailing' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span className="truncate max-w-[180px]">Mailing: {businessMailingAddress}</span>
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        {phone && (
          <a
            href={`tel:${phone.replace(/[^0-9]/g, '')}`}
            className="text-slate-600 hover:text-teal-700 flex items-center gap-1"
            title={`Call ${phone}`}
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>Call</span>
          </a>
        )}
        {email && (
          <a
            href={mailtoUrl}
            className="text-slate-600 hover:text-teal-700 flex items-center gap-1"
            title={`Email ${email}`}
          >
            <Mail className="w-3.5 h-3.5 text-teal-600" />
            <span>Email</span>
          </a>
        )}
        {website && (
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-teal-700 flex items-center gap-1"
            title={`Visit ${website}`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Website</span>
          </a>
        )}
      </div>
    );
  }

  // Default 'tiles' variant
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
      {/* Phone Tile */}
      <a
        href={phone ? `tel:${phone.replace(/[^0-9]/g, '')}` : '#'}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/70 text-center transition-all cursor-pointer group"
      >
        <Phone className="w-3.5 h-3.5 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold text-slate-900">Call Office</span>
        <span className="text-[10px] text-slate-400 truncate max-w-full">{phone || 'Phone on file'}</span>
      </a>

      {/* Email Tile */}
      <a
        href={email ? mailtoUrl : '#'}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/70 text-center transition-all cursor-pointer group"
      >
        <Mail className="w-3.5 h-3.5 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold text-slate-900">Email Agent</span>
        <span className="text-[10px] text-slate-400 truncate max-w-full">{email || 'Email on file'}</span>
      </a>

      {/* Website Tile */}
      <a
        href={webUrl || '#'}
        target={website ? '_blank' : undefined}
        rel={website ? 'noopener noreferrer' : undefined}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/70 text-center transition-all cursor-pointer group"
      >
        <Globe className="w-3.5 h-3.5 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold text-slate-900">Website</span>
        <span className="text-[10px] text-slate-400 truncate max-w-full">{website || 'Web Portal'}</span>
      </a>

      {/* Address Copy Tile */}
      {address && (
        <button
          type="button"
          onClick={() => handleCopy(address, 'address', 'office address')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/70 text-center transition-all cursor-pointer group"
        >
          {copiedKey === 'address' ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 mb-1" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-semibold text-slate-900">
            {copiedKey === 'address' ? 'Copied!' : 'Copy Office'}
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-full">Postal Address</span>
        </button>
      )}
    </div>
  );
};
