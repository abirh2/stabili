import React, { useState } from 'react';
import { Check, Copy, Globe, Mail, Phone } from 'lucide-react';

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
  emptyStateText = 'Management contact information was not available in the current public record.',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const mailingAddressToUse = address || businessMailingAddress;
  const hasDirectContact = Boolean(phone || email || website);

  const handleCopy = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      onToast?.(`Copied ${label} to clipboard`);
      window.setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      onToast?.(`Could not copy ${label}`);
    }
  };

  if (!hasDirectContact && !mailingAddressToUse) {
    return <p className={`type-metadata surface-muted radius-control p-3 ${className}`}>{emptyStateText}</p>;
  }

  const mailtoUrl = email ? `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}` : undefined;
  const webUrl = website ? (website.startsWith('http') ? website : `https://${website}`) : undefined;
  const compact = variant === 'compact';
  const actionClass = compact
    ? 'type-metadata inline-flex min-h-11 items-center gap-1.5 text-accent'
    : 'st-button st-button--secondary';

  return (
    <div className={`${variant === 'tiles' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'flex flex-wrap items-center gap-2'} ${className}`}>
      {phone && (
        <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className={actionClass}>
          <Phone className="h-4 w-4 text-accent" />
          <span>{compact ? 'Call' : phone}</span>
        </a>
      )}
      {email && (
        <a href={mailtoUrl} className={actionClass}>
          <Mail className="h-4 w-4 text-accent" />
          <span className="max-w-[16rem] truncate">{compact ? 'Email' : email}</span>
        </a>
      )}
      {website && (
        <a href={webUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
          <Globe className="h-4 w-4 text-accent" />
          <span className="max-w-[14rem] truncate">{compact ? 'Website' : website}</span>
        </a>
      )}
      {mailingAddressToUse && (
        <button type="button" onClick={() => handleCopy(mailingAddressToUse, 'address', 'mailing address')} className={actionClass}>
          {copiedKey === 'address' ? <Check className="h-4 w-4 text-[var(--st-positive)]" /> : <Copy className="h-4 w-4 text-accent" />}
          <span className="max-w-[18rem] truncate">{copiedKey === 'address' ? 'Copied' : compact ? 'Copy address' : mailingAddressToUse}</span>
        </button>
      )}
    </div>
  );
};
