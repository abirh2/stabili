import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './Button';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "Search by address, neighborhood, ZIP code, or managing company...",
  className = '',
  ...props
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(String(value || ''));
    }
  };

  return (
    <div className={`relative w-full group ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200/90 rounded-full text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-xs hover:border-slate-300 transition-all"
        {...props}
      />

      <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1.5">
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <Button
          size="sm"
          isPill
          variant="primary"
          onClick={() => onSearch && onSearch(String(value || ''))}
          className="px-4 py-1.5 text-xs font-medium"
        >
          Search
        </Button>
      </div>
    </div>
  );
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-0.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`w-full ${leftIcon ? 'pl-10' : 'px-3.5'} py-2.5 bg-white border ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200/90 focus:border-teal-600 focus:ring-teal-500/20'
          } rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-600">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};

