import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterChipProps {
  label: string;
  options?: (string | FilterOption)[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  isActive?: boolean;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  options = [],
  selectedValue,
  onSelect,
  isActive = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions: FilterOption[] = options.map((opt) => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const displayLabel = selectedValue && selectedValue !== 'All' 
    ? `${label}: ${selectedValue}` 
    : label;

  const isHighlighted = isActive || (selectedValue && selectedValue !== 'All');

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="st-chip"
        data-active={isHighlighted ? 'true' : 'false'}
      >
        <span>{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-tertiary transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && normalizedOptions.length > 0 && (
        <div className="st-popover absolute left-0 mt-1.5 min-w-[200px] p-1.5 z-50" role="listbox">
          <div className="max-h-60 overflow-y-auto stabili-scroller py-0.5">
            {normalizedOptions.map((option) => {
              const isSelected = selectedValue === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (onSelect) onSelect(option.value);
                    setIsOpen(false);
                  }}
                  className="st-option cursor-pointer"
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
