import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Briefcase, Building2, Search, X } from 'lucide-react';
import { displayBorough } from '../../data/adapters';
import { loadBuildingIndex, managementKey } from '../../data/client';
import type { StabiliIndexRecord } from '../../data/schema';
import type { Route } from '../../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectBuilding,
  onSelectManagement,
}) => {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<StabiliIndexRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => inputRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || records.length) return;
    setLoading(true);
    setError(false);
    loadBuildingIndex()
      .then(setRecords)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isOpen, records.length]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return { buildings: [] as StabiliIndexRecord[], management: [] as string[] };
    const buildings = records.filter((record) =>
      [record.address, record.zipCode, displayBorough(record.borough), record.managementName]
        .some((value) => value?.toLocaleLowerCase().includes(normalized))
    ).slice(0, 6);
    const management = Array.from(new Set(records
      .map((record) => record.managementName)
      .filter((value): value is string => Boolean(value) && value!.toLocaleLowerCase().includes(normalized))))
      .slice(0, 4);
    return { buildings, management };
  }, [query, records]);

  if (!isOpen) return null;
  const hasResults = results.buildings.length > 0 || results.management.length > 0;

  return (
    <div className="st-scrim fixed inset-0 z-50 flex items-start justify-center px-3 pt-3 sm:px-4 sm:pt-24" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-search-title"
        className="st-dialog flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden sm:max-h-[70vh]"
      >
        <h2 id="quick-search-title" className="sr-only">Quick search</h2>
        <div className="separator flex items-center gap-3 border-b px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-accent" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search address, borough, ZIP, or management"
            className="type-body min-w-0 flex-1 bg-transparent text-primary outline-none placeholder:text-tertiary"
            aria-controls="quick-search-results"
            aria-autocomplete="list"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="st-button st-button--ghost st-button--pill !min-h-11 !w-11 !p-0" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onClose} className="st-button st-button--ghost st-button--sm" aria-label="Close quick search">
            <span className="hidden sm:inline">Close</span>
            <X className="h-4 w-4 sm:hidden" />
          </button>
        </div>

        <div id="quick-search-results" role="listbox" className="stabili-scroller flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="type-metadata p-8 text-center" role="status">Loading the search index…</p>
          ) : error ? (
            <p className="type-metadata p-8 text-center" style={{ color: 'var(--st-negative)' }} role="alert">The search index could not be loaded. Try again later.</p>
          ) : !query.trim() ? (
            <p className="type-metadata p-8 text-center">Start typing to search the current generated dataset.</p>
          ) : !hasResults ? (
            <p className="type-metadata p-8 text-center" role="status">No matching records found.</p>
          ) : (
            <>
              {results.buildings.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => { onSelectBuilding(record.id); onClose(); }}
                  className="st-option group !min-h-14 !items-center !px-3 !py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Building2 className="h-5 w-5 shrink-0 text-accent" />
                    <span className="min-w-0">
                      <strong className="type-building-title block truncate">{record.address ?? 'Address unavailable'}</strong>
                      <small className="type-metadata block truncate">{displayBorough(record.borough)}{record.zipCode ? ` · ${record.zipCode}` : ''}</small>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-tertiary" />
                </button>
              ))}
              {results.management.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => { onSelectManagement(managementKey(name)); onClose(); }}
                  className="st-option !min-h-14 !items-center !px-3 !py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Briefcase className="h-5 w-5 shrink-0 text-secondary" />
                    <span className="min-w-0">
                      <strong className="type-building-title block truncate">{name}</strong>
                      <small className="type-metadata block truncate">Exact management name on generated records</small>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-tertiary" />
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
