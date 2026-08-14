import React, { useState, useEffect } from 'react';
import { Search, X, Building2, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { Route } from '../../types';

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
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sampleResults = [
    {
      type: 'building',
      id: '172-182-castleton-ave',
      title: '172-182 Castleton Avenue',
      subtitle: 'Silver Lake, Staten Island · Also associated with 351 Woodstock Ave · Garden complex',
      badge: 'Garden complex',
    },
    {
      type: 'building',
      id: '29-avon-pl',
      title: '29 Avon Place',
      subtitle: 'St. George, Staten Island · Also associated with 31 Avon Pl',
      badge: 'Stabilized Record',
    },
    {
      type: 'building',
      id: '32-20-89th-st',
      title: '32-20 - 32-34 89th Street',
      subtitle: 'Jackson Heights, Queens · Part of Jackson Heights Garden Colony',
      badge: 'Garden complex',
    },
    {
      type: 'building',
      id: '3151-perry-ave',
      title: '3151 Perry Avenue',
      subtitle: 'Norwood, Bronx · 42 Stabilized Units',
      badge: 'Stabilized Record',
    },
    {
      type: 'building',
      id: '28-15-34th-st',
      title: '28-15 34th Street',
      subtitle: 'Astoria, Queens · 24 Stabilized Units',
      badge: 'Stabilized Record',
    },
    {
      type: 'management',
      id: 'example-mgmt',
      title: 'Example Management LLC',
      subtitle: '12 Stabilized Buildings in NYC · ~518 Units',
      badge: 'Verified Owner',
    },
    {
      type: 'neighborhood',
      id: 'astoria',
      title: 'Astoria, Queens',
      subtitle: 'Over 1,200 Rent-Stabilized buildings',
      badge: 'Neighborhood',
    },
  ].filter((item) => 
    !query || item.title.toLowerCase().includes(query.toLowerCase()) || item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/25 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3">
          <Search className="w-4 h-4 text-teal-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, neighborhood, or management..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer transition-colors"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200/80 cursor-pointer hover:bg-slate-200/70 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Quick Results */}
        <div className="max-h-80 overflow-y-auto stabili-scroller p-2 space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            {query ? 'Search Results' : 'Suggested NYC Searches'}
          </div>

          {sampleResults.map((res) => (
            <button
              key={res.id}
              onClick={() => {
                if (res.type === 'building') {
                  onSelectBuilding(res.id);
                } else if (res.type === 'management') {
                  onSelectManagement(res.id);
                } else {
                  onNavigate('explore');
                }
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100/80">
                  {res.type === 'building' && <Building2 className="w-4 h-4" />}
                  {res.type === 'management' && <Briefcase className="w-4 h-4" />}
                  {res.type === 'neighborhood' && <MapPin className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-900 group-hover:text-teal-800 transition-colors">
                      {res.title}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70">
                      {res.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{res.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Filter by borough or search directly</span>
          <span className="text-[11px] text-slate-400">Press ↵ to select</span>
        </div>
      </div>
    </div>
  );
};

