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
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-tertiary group-focus-within:text-accent transition-colors">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="st-input pl-11 pr-24 py-3"
        {...props}
      />

      <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1.5">
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="st-button st-button--ghost st-button--pill !min-h-8 !w-8 !p-0"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <Button
          size="sm"
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
        <label className="type-label px-0.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tertiary">
            {leftIcon}
          </div>
        )}
        <input
          aria-invalid={Boolean(error)}
          className={`st-input ${leftIcon ? 'pl-10 pr-3.5' : 'px-3.5'} py-2.5 ${className}`}
          {...props}
        />
      </div>
      {error && <span className="type-metadata" style={{ color: 'var(--st-negative)' }}>{error}</span>}
      {helperText && !error && <span className="type-metadata">{helperText}</span>}
    </div>
  );
};
