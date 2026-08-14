import React, { useState } from 'react';
import { Check, Copy, Globe, Mail, Phone } from 'lucide-react';

export interface ContactActionsProps {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  businessMailingAddress?: string | null;
  variant?: 'tiles' | 'pills' | 'compact' | 'buttons' | 'rows';
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

  const fallbackCopy = (text: string) => {
    const fallback = document.createElement('textarea');
    fallback.value = text;
    fallback.setAttribute('readonly', '');
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.appendChild(fallback);
    let didCopy = false;
    try {
      fallback.select();
      didCopy = document.execCommand('copy');
    } finally {
      fallback.remove();
    }
    if (!didCopy) throw new Error('Copy command was rejected');
  };

  const handleCopy = async (text: string, key: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          fallbackCopy(text);
        }
      } else {
        fallbackCopy(text);
      }
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
  const rows = variant === 'rows';
  const actionClass = rows
    ? 'management-contact-link'
    : compact
    ? 'type-metadata inline-flex min-h-11 items-center gap-1.5 text-accent'
    : 'st-button st-button--secondary';

  const actionContent = (label: string, value: string, icon: React.ReactNode) => (
    <>
      <span className="management-contact-link__icon">{icon}</span>
      <span><small>{label}</small><strong>{rows ? value : label}</strong></span>
    </>
  );

  return (
    <div className={`${rows ? 'management-contact-list' : variant === 'tiles' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'flex flex-wrap items-center gap-2'} ${className}`}>
      {phone && (
        <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className={actionClass}>
          {rows ? actionContent('Call', phone, <Phone className="h-4 w-4" aria-hidden="true" />) : <><Phone className="h-4 w-4 text-accent" /><span>{compact ? 'Call' : phone}</span></>}
        </a>
      )}
      {email && (
        <a href={mailtoUrl} className={actionClass}>
          {rows ? actionContent('Email', email, <Mail className="h-4 w-4" aria-hidden="true" />) : <><Mail className="h-4 w-4 text-accent" /><span className="max-w-[16rem] truncate">{compact ? 'Email' : email}</span></>}
        </a>
      )}
      {website && (
        <a href={webUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
          {rows ? actionContent('Website', website, <Globe className="h-4 w-4" aria-hidden="true" />) : <><Globe className="h-4 w-4 text-accent" /><span className="max-w-[14rem] truncate">{compact ? 'Website' : website}</span></>}
        </a>
      )}
      {mailingAddressToUse && (
        <button type="button" onClick={() => handleCopy(mailingAddressToUse, 'address', 'mailing address')} className={actionClass}>
          {rows ? actionContent(copiedKey === 'address' ? 'Copied' : 'Copy address', mailingAddressToUse, copiedKey === 'address' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />) : <>{copiedKey === 'address' ? <Check className="h-4 w-4 text-[var(--st-positive)]" /> : <Copy className="h-4 w-4 text-accent" />}<span className="max-w-[18rem] truncate">{copiedKey === 'address' ? 'Copied' : compact ? 'Copy address' : mailingAddressToUse}</span></>}
        </button>
      )}
      <span className="sr-only" aria-live="polite">{copiedKey === 'address' ? 'Address copied to clipboard' : ''}</span>
    </div>
  );
};
