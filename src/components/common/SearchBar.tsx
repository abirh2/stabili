import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  onSubmit?: (e: React.FormEvent) => void;
  onClick?: () => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  shortcutBadge?: string;
  autoFocus?: boolean;
  id?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search by address, borough, ZIP, or management...',
  onSubmit,
  onClick,
  readOnly = false,
  size = 'md',
  className = '',
  shortcutBadge,
  autoFocus = false,
  id = 'stabili-search-bar',
}) => {
  const sizeStyles = {
    sm: 'h-9 text-xs pl-8 pr-8',
    md: 'h-10 text-sm pl-9 pr-9',
    lg: 'h-12 text-base pl-11 pr-11',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
    lg: 'w-5 h-5 left-3.5',
  }[size];

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(e);
      }}
      className={`relative w-full ${className}`}
      onClick={onClick}
    >
      <Search
        className={`absolute ${iconSizes} top-1/2 -translate-y-1/2 text-tertiary pointer-events-none`}
      />

      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        className={`st-input ${
          readOnly ? 'cursor-pointer select-none' : ''
        } ${sizeStyles}`}
      />

      {value && !readOnly ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 st-button st-button--ghost !min-h-8 !w-8 !p-0"
          aria-label="Clear search"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcutBadge ? (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center px-1.5 py-0.5 rounded-md surface-muted type-caption pointer-events-none">
          {shortcutBadge}
        </kbd>
      ) : null}
    </form>
  );
};
