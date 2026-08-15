import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterChipProps {
  label: string;
  options: (string | FilterOption)[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function summarizeFilter(label: string, selectedValues: string[], options: FilterOption[]): string {
  if (selectedValues.length === 0) return label;
  const first = options.find((option) => option.value === selectedValues[0])?.label ?? selectedValues[0];
  return selectedValues.length === 1 ? first : `${first} +${selectedValues.length - 1}`;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  isOpen: controlledOpen,
  onOpenChange,
  className = '',
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();
  const normalizedOptions = options.map((option) => (
    typeof option === 'string' ? { label: option, value: option } : option
  ));
  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = (open: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const update = () => setIsCompact(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    if (isCompact) document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => {
      const target = isCompact
        ? closeButtonRef.current
        : rootRef.current?.querySelector<HTMLButtonElement>('[role="checkbox"]');
      target?.focus();
    });
    const closeAndRestoreFocus = () => {
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAndRestoreFocus();
    };
    const handlePointerDown = (event: MouseEvent) => {
      if (!isCompact && rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isCompact, isOpen]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const toggleValue = (value: string) => {
    onChange(selectedValues.includes(value)
      ? selectedValues.filter((selected) => selected !== value)
      : [...selectedValues, value]);
  };

  return (
    <div className={`filter-chip relative inline-block ${className}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? panelId : undefined}
        className="st-chip max-w-48"
        data-active={selectedValues.length > 0 ? 'true' : 'false'}
      >
        <span className="truncate">{summarizeFilter(label, selectedValues, normalizedOptions)}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          <button className="filter-chip__scrim st-scrim" type="button" aria-label={`Close ${label} filter`} onClick={close} />
          <section id={panelId} className="filter-chip__panel st-popover" role="dialog" aria-labelledby={titleId}>
            <div className="explore-filter-handle" aria-hidden="true" />
            <header className="filter-chip__header">
              <div>
                <h2 id={titleId} className="type-section-title">{label}</h2>
                <p className="type-metadata mt-1">Select any that apply.</p>
              </div>
              <button ref={closeButtonRef} type="button" className="filter-chip__close st-button st-button--ghost" onClick={close} aria-label={`Close ${label} filter`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="filter-chip__options stabili-scroller" role="group" aria-label={`${label} options`}>
              {normalizedOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => toggleValue(option.value)}
                    className="st-option"
                  >
                    <span>{option.label}</span>
                    <span className="st-checkbox" aria-hidden="true">
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <footer className="filter-chip__footer">
              <button type="button" className="st-button st-button--ghost" onClick={() => onChange([])} disabled={selectedValues.length === 0}>Clear</button>
              <button type="button" className="st-button st-button--primary" onClick={close}>Done</button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
};
