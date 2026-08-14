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
    sm: 'h-9 text-xs pl-8 pr-8 rounded-xl',
    md: 'h-10 text-xs sm:text-sm pl-9 pr-9 rounded-xl',
    lg: 'h-12 text-sm sm:text-base pl-11 pr-11 rounded-2xl',
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
        className={`absolute ${iconSizes} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`}
      />

      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        className={`w-full bg-white border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/60 focus:border-teal-700/60 shadow-2xs transition-all ${
          readOnly ? 'cursor-pointer select-none' : ''
        } ${sizeStyles}`}
      />

      {value && !readOnly ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcutBadge ? (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-400 pointer-events-none">
          {shortcutBadge}
        </div>
      ) : null}
    </form>
  );
};
