import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, List, Map as MapIcon, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { EmptyState, FilterChip, PublicRecordErrorState, SearchBar, SearchResultSkeleton } from '../components/common';
import { BuildingCard } from '../components/explore/BuildingCard';
import { ExploreMap } from '../components/explore/ExploreMap';
import { indexToBuilding } from '../data/adapters';
import { loadBuildingIndex } from '../data/client';
import type { StabiliIndexRecord } from '../data/schema';
import type { Route } from '../types';

interface ExplorePageProps {
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
  savedBuildingIds: string[];
  onToggleSaveBuilding: (id: string) => void;
}

const boroughLabels: Record<StabiliIndexRecord['borough'], string> = {
  bronx: 'Bronx', brooklyn: 'Brooklyn', manhattan: 'Manhattan', queens: 'Queens', staten_island: 'Staten Island',
};
const healthLabels: Record<StabiliIndexRecord['healthState'], string> = {
  low_concern: 'Low concern', some_concerns: 'Some concerns', higher_concern: 'Higher concern', insufficient_data: 'Not enough data',
};
const DISPLAY_LIMIT = 100;

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onSelectBuilding,
  savedBuildingIds,
  onToggleSaveBuilding,
}) => {
  const [records, setRecords] = useState<StabiliIndexRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [borough, setBorough] = useState('All');
  const [zip, setZip] = useState('All');
  const [health, setHealth] = useState('All');
  const [management, setManagement] = useState('All');
  const [matchStatus, setMatchStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'units-desc' | 'year-desc' | 'violations-asc'>('default');
  const [desktopLayout, setDesktopLayout] = useState<'split' | 'list'>('split');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const moreFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const closeFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const filtersWereOpenRef = useRef(false);

  const load = () => {
    setLoading(true);
    setError(false);
    loadBuildingIndex()
      .then(setRecords)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateLayout = (event: MediaQueryListEvent | MediaQueryList) => setIsDesktop(event.matches);
    updateLayout(mediaQuery);
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (!moreFiltersOpen) {
      if (filtersWereOpenRef.current) moreFiltersButtonRef.current?.focus();
      filtersWereOpenRef.current = false;
      return;
    }
    filtersWereOpenRef.current = true;
    const focusFrame = window.requestAnimationFrame(() => closeFiltersButtonRef.current?.focus());
    const isCompactSheet = window.matchMedia('(max-width: 639px)').matches;
    const previousOverflow = document.body.style.overflow;
    if (isCompactSheet) document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreFiltersOpen(false);
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) setMoreFiltersOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (isCompactSheet) document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [moreFiltersOpen]);

  const zips = useMemo(() => Array.from(new Set(records.map((record) => record.zipCode).filter((value): value is string => Boolean(value)))).sort(), [records]);
  const hasFilters = Boolean(searchQuery.trim() || borough !== 'All' || zip !== 'All' || health !== 'All' || management !== 'All' || matchStatus !== 'All');
  const additionalFilterCount = [zip, management, matchStatus].filter((value) => value !== 'All').length;

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const result = records.filter((record) => {
      if (query && ![
        record.address,
        boroughLabels[record.borough],
        record.zipCode,
        record.managementName,
        record.ownerName,
      ].some((value) => value?.toLocaleLowerCase().includes(query))) return false;
      if (borough !== 'All' && boroughLabels[record.borough] !== borough) return false;
      if (zip !== 'All' && record.zipCode !== zip) return false;
      if (health !== 'All' && healthLabels[record.healthState] !== health) return false;
      if (management === 'Name available' && !record.managementName) return false;
      if (management === 'Name unavailable' && record.managementName) return false;
      if (matchStatus !== 'All' && record.propertyMatchStatus !== matchStatus) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === 'units-desc') return (b.residentialUnits ?? -1) - (a.residentialUnits ?? -1);
      if (sortBy === 'year-desc') return (b.yearBuilt ?? -1) - (a.yearBuilt ?? -1);
      if (sortBy === 'violations-asc') return (a.openViolationCount ?? Number.MAX_SAFE_INTEGER) - (b.openViolationCount ?? Number.MAX_SAFE_INTEGER);
      return 0;
    });
    return result;
  }, [records, searchQuery, borough, zip, health, management, matchStatus, sortBy]);

  const visibleBuildings = useMemo(() => filtered.slice(0, DISPLAY_LIMIT).map(indexToBuilding), [filtered]);

  const reset = () => {
    setSearchQuery(''); setBorough('All'); setZip('All'); setHealth('All'); setManagement('All'); setMatchStatus('All');
  };

  return (
    <div className="surface-base text-primary w-full min-h-screen flex flex-col">
      <section className="explore-search-zone pt-20 md:pt-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-[1240px] mx-auto w-full">
          <div className="max-w-3xl">
            <h1 className="type-page-title">Explore stabilized buildings</h1>
            <p className="type-body text-secondary mt-1.5 max-w-2xl">Search New York City public records by address, place, or management name.</p>
          </div>
          <div className="explore-search mt-4 w-full max-w-4xl">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search an address, borough, ZIP, or management name" size="lg" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2" ref={filtersRef}>
            <FilterChip label="Borough" options={['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']} selectedValue={borough} onSelect={setBorough} />
            <FilterChip label="Building health" options={['All', 'Low concern', 'Some concerns', 'Higher concern', 'Not enough data']} selectedValue={health} onSelect={setHealth} />
            <div className="relative">
              <button
                ref={moreFiltersButtonRef}
                type="button"
                className="st-chip"
                data-active={additionalFilterCount > 0 ? 'true' : 'false'}
                aria-expanded={moreFiltersOpen}
                aria-controls="explore-more-filters"
                onClick={() => setMoreFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                More filters{additionalFilterCount > 0 ? ` · ${additionalFilterCount}` : ''}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreFiltersOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {moreFiltersOpen && (
                <>
                  <button className="explore-filter-scrim st-scrim" type="button" aria-label="Close filters" onClick={() => setMoreFiltersOpen(false)} />
                  <section id="explore-more-filters" className="explore-filter-panel material-sheet" role="dialog" aria-labelledby="explore-filter-title">
                    <div className="explore-filter-handle" aria-hidden="true" />
                    <header className="flex items-start justify-between gap-4">
                      <div>
                        <h2 id="explore-filter-title" className="type-section-title">More filters</h2>
                        <p className="type-metadata mt-1">Refine the same public-record results.</p>
                      </div>
                      <button ref={closeFiltersButtonRef} type="button" className="st-button st-button--ghost !min-h-11 !w-11 !p-0" onClick={() => setMoreFiltersOpen(false)} aria-label="Close filters">
                        <X className="h-4 w-4" />
                      </button>
                    </header>

                    <div className="mt-5 grid gap-4">
                      <label className="explore-filter-field">
                        <span>ZIP code</span>
                        <select value={zip} onChange={(event) => setZip(event.target.value)} className="st-input px-3">
                          <option>All</option>{zips.map((value) => <option key={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className="explore-filter-field">
                        <span>Management availability</span>
                        <select value={management} onChange={(event) => setManagement(event.target.value)} className="st-input px-3">
                          <option>All</option><option>Name available</option><option>Name unavailable</option>
                        </select>
                      </label>
                      <label className="explore-filter-field">
                        <span>Property record match</span>
                        <select value={matchStatus} onChange={(event) => setMatchStatus(event.target.value)} className="st-input px-3">
                          <option value="All">All records</option><option value="matched">Matched</option><option value="ambiguous">Ambiguous</option>
                        </select>
                      </label>
                    </div>

                    <footer className="separator mt-6 flex items-center gap-3 border-t pt-4">
                      <button type="button" onClick={reset} className="st-button st-button--ghost flex-1"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
                      <button type="button" onClick={() => setMoreFiltersOpen(false)} className="st-button st-button--primary flex-[1.4]"><Check className="h-4 w-4" />Apply filters</button>
                    </footer>
                  </section>
                </>
              )}
            </div>
            {hasFilters && <button onClick={reset} className="st-button st-button--ghost st-button--sm"><RotateCcw className="h-3.5 w-3.5" />Clear</button>}
          </div>
        </div>
      </section>

      <main className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 md:px-8 pb-8 pt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SearchResultSkeleton /><SearchResultSkeleton /><SearchResultSkeleton /><SearchResultSkeleton /></div>
        ) : error ? (
          <PublicRecordErrorState description="The generated Stabili index could not be loaded." onRetry={load} />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <h2 className="type-section-title">{filtered.length.toLocaleString()} buildings</h2>
                {filtered.length > DISPLAY_LIMIT && <p className="type-metadata">Showing the first {DISPLAY_LIMIT}; narrow the filters to refine results.</p>}
              </div>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="explore-sort">Sort buildings</label>
                <select id="explore-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="st-input !min-h-11 w-auto px-3 py-2 text-xs font-medium">
                  <option value="default">Source order</option><option value="units-desc">Most units</option><option value="year-desc">Newest built</option><option value="violations-asc">Fewest open violations</option>
                </select>
                <div className="explore-view-toggle flex md:hidden" aria-label="Explore view">
                  <button type="button" onClick={() => setMobileView('list')} className="st-chip !min-h-11 !w-11 !p-0" data-active={mobileView === 'list'} title="List view" aria-label="List view" aria-pressed={mobileView === 'list'}><List className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setMobileView('map')} className="st-chip !min-h-11 !w-11 !p-0" data-active={mobileView === 'map'} title="Map view" aria-label="Map view" aria-pressed={mobileView === 'map'}><MapIcon className="w-4 h-4" /></button>
                </div>
                <div className="explore-view-toggle hidden md:flex" aria-label="Explore layout">
                  <button type="button" onClick={() => setDesktopLayout('split')} className="st-chip !min-h-11 !w-11 !p-0" data-active={desktopLayout === 'split'} title="List and map" aria-label="List and map" aria-pressed={desktopLayout === 'split'}><MapIcon className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setDesktopLayout('list')} className="st-chip !min-h-11 !w-11 !p-0" data-active={desktopLayout === 'list'} title="List only" aria-label="List only" aria-pressed={desktopLayout === 'list'}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            {visibleBuildings.length === 0 ? (
              <EmptyState icon={<Building2 className="w-6 h-6" />} title="No buildings match these filters" description="Try a different address, ZIP, borough, health state, or management filter." actionLabel="Clear filters" onAction={reset} />
            ) : (
              <div className={`explore-results-layout ${desktopLayout === 'split' ? 'is-split' : 'is-list-only'}`}>
                {(isDesktop || mobileView === 'list') && <div className="explore-result-list separator border-t">
                  {visibleBuildings.map((building) => <BuildingCard key={building.id} building={building} isSelected={activeBuildingId === building.id} isSaved={savedBuildingIds.includes(building.id)} onSelect={onSelectBuilding} onToggleSave={onToggleSaveBuilding} onHover={setActiveBuildingId} />)}
                </div>}
                {((isDesktop && desktopLayout === 'split') || (!isDesktop && mobileView === 'map')) && <div className="explore-map-column"><ExploreMap buildings={visibleBuildings} activeBuildingId={activeBuildingId} onSelectBuilding={onSelectBuilding} onHoverBuilding={setActiveBuildingId} /></div>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
