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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-150 cursor-pointer select-none border ${
          isHighlighted
            ? 'bg-teal-50 text-teal-800 border-teal-200/80 shadow-xs font-semibold'
            : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
        }`}
      >
        <span>{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && normalizedOptions.length > 0 && (
        <div className="absolute left-0 mt-1.5 min-w-[200px] bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-md z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto stabili-scroller py-0.5">
            {normalizedOptions.map((option) => {
              const isSelected = selectedValue === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (onSelect) onSelect(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

