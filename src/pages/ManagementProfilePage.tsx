import React, { useState, useMemo } from 'react';
import { SAMPLE_MANAGEMENT, ALL_SAMPLE_MANAGEMENT, SAMPLE_BUILDINGS } from '../data/sampleData';
import { 
  Badge, 
  Button, 
  BuildingCard, 
  PageContainer, 
  StatItem, 
  SectionHeader, 
  EmptyState, 
  ContactActions, 
  SearchBar 
} from '../components/common';
import { Route, BuildingRecord } from '../types';
import { 
  MapPin, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Check, 
  Copy, 
  Share2, 
  Sparkles, 
  X, 
  MessageSquare, 
  Mail 
} from 'lucide-react';

interface ManagementProfilePageProps {
  managementId: string;
  onSelectBuilding: (id: string) => void;
  onNavigate: (route: Route) => void;
  savedBuildingIds?: string[];
  onToggleSaveBuilding?: (id: string) => void;
}

export const ManagementProfilePage: React.FC<ManagementProfilePageProps> = ({
  managementId,
  onSelectBuilding,
  onNavigate,
  savedBuildingIds = [],
  onToggleSaveBuilding = () => {},
}) => {
  // Retrieve management data with fallback to SAMPLE_MANAGEMENT
  const management = ALL_SAMPLE_MANAGEMENT[managementId] || SAMPLE_MANAGEMENT;

  // Filter state
  const [selectedBorough, setSelectedBorough] = useState<string>('All');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('All');
  const [selectedHealth, setSelectedHealth] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'units-desc' | 'violations-asc' | 'year-desc' | 'address-asc'>('units-desc');

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState<boolean>(false);
  const [inquiryBorough, setInquiryBorough] = useState<string>('Any Borough');
  const [inquiryBedrooms, setInquiryBedrooms] = useState<string>('1 Bedroom');

  // Get all buildings managed by this company
  const managedBuildings = useMemo(() => {
    return SAMPLE_BUILDINGS.filter(
      (b) => b.managementId === management.id || b.managingAgent.toLowerCase() === management.name.toLowerCase()
    );
  }, [management.id, management.name]);

  // Derived available boroughs in this company's actual portfolio
  const availableBoroughs = useMemo(() => {
    const boroughs = new Set<string>();
    managedBuildings.forEach((b) => boroughs.add(b.borough));
    return Array.from(boroughs).sort();
  }, [managedBuildings]);

  // Derived available neighborhoods based on selected borough
  const availableNeighborhoods = useMemo(() => {
    const neighborhoods = new Set<string>();
    managedBuildings
      .filter((b) => selectedBorough === 'All' || b.borough === selectedBorough)
      .forEach((b) => neighborhoods.add(b.neighborhood));
    return Array.from(neighborhoods).sort();
  }, [managedBuildings, selectedBorough]);

  // Calculate dynamic borough counts & unit stats from managedBuildings
  const portfolioStats = useMemo(() => {
    const totalBuildings = managedBuildings.length || management.totalStabilizedBuildings;
    const totalUnits = managedBuildings.reduce((acc, b) => acc + (b.units || 0), 0) || management.totalResidentialUnits;
    
    const byBorough: Record<string, { count: number; units: number }> = {};
    managedBuildings.forEach((b) => {
      if (!byBorough[b.borough]) {
        byBorough[b.borough] = { count: 0, units: 0 };
      }
      byBorough[b.borough].count += 1;
      byBorough[b.borough].units += (b.units || 0);
    });

    const goodHealthCount = managedBuildings.filter((b) => b.health === 'Good').length;
    const needsAttentionCount = managedBuildings.filter((b) => b.health === 'Needs Attention').length;

    return {
      totalBuildings,
      totalUnits,
      byBorough,
      goodHealthCount,
      needsAttentionCount,
    };
  }, [managedBuildings, management]);

  // Filtered & sorted buildings list
  const filteredBuildings = useMemo(() => {
    return managedBuildings
      .filter((b) => {
        const matchesBorough = selectedBorough === 'All' || b.borough === selectedBorough;
        const matchesNeighborhood = selectedNeighborhood === 'All' || b.neighborhood === selectedNeighborhood;
        const matchesHealth = selectedHealth === 'All' || b.health === selectedHealth;
        const matchesSearch = 
          searchQuery.trim() === '' ||
          b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.zipCode.includes(searchQuery);

        return matchesBorough && matchesNeighborhood && matchesHealth && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'units-desc') return (b.units || 0) - (a.units || 0);
        if (sortBy === 'violations-asc') return (a.openViolationsCount || 0) - (b.openViolationsCount || 0);
        if (sortBy === 'year-desc') return (b.yearBuilt || 0) - (a.yearBuilt || 0);
        if (sortBy === 'address-asc') return a.address.localeCompare(b.address);
        return 0;
      });
  }, [managedBuildings, selectedBorough, selectedNeighborhood, selectedHealth, searchQuery, sortBy]);

  // Toast handler
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    triggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleResetFilters = () => {
    setSelectedBorough('All');
    setSelectedNeighborhood('All');
    setSelectedHealth('All');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedBorough !== 'All' || selectedNeighborhood !== 'All' || selectedHealth !== 'All' || searchQuery !== '';

  return (
    <PageContainer
      maxWidth="1200"
      id="management-profile-container"
      backAction={{
        label: 'Back to Explore',
        onBack: () => onNavigate('explore'),
      }}
      headerRight={
        <button
          onClick={() => handleCopy(window.location.href, 'share', 'page link')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedKey === 'share' ? 'Link Copied!' : 'Share Portfolio'}</span>
        </button>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-8 pt-2">
        {/* =========================================================================
            1. TOP MANAGEMENT HEADER CARD
        ========================================================================= */}
        <section 
          id="management-header-card"
          className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 md:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left Info: Name, Badges & Office Address */}
            <div className="max-w-3xl space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="verified" size="sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>NYC HPD Registered Operating Agent</span>
                </Badge>
                <Badge variant="health-good" size="sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Verified Contact Records</span>
                </Badge>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                  {management.name}
                </h1>
                
                {/* Office Address */}
                <div className="flex items-start sm:items-center gap-2 text-slate-600 text-xs sm:text-sm mt-2 font-normal">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
                  <span>{management.address}</span>
                  <button
                    onClick={() => handleCopy(management.address, 'address', 'office address')}
                    className="text-xs text-slate-400 hover:text-teal-700 transition-colors p-1 cursor-pointer"
                    title="Copy address"
                  >
                    {copiedKey === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Reusable Contact Actions Bar */}
              <div className="pt-1">
                <ContactActions
                  phone={management.phone}
                  email={management.email}
                  website={management.website}
                  variant="pills"
                  onToast={triggerToast}
                />
              </div>
            </div>

            {/* Right: Primary Inquiry CTA & Metric Highlights Box */}
            <div className="lg:w-72 shrink-0 flex flex-col gap-3">
              <Button
                variant="primary"
                size="md"
                isPill
                leftIcon={<MessageSquare className="w-4 h-4" />}
                onClick={() => setInquiryModalOpen(true)}
                className="w-full"
              >
                Inquire about vacancies
              </Button>

              {/* Quick stats container */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                <StatItem
                  variant="row"
                  label="Stabilized Buildings"
                  value={`${portfolioStats.totalBuildings} properties`}
                />
                <StatItem
                  variant="row"
                  label="Residential Units"
                  value={`~${portfolioStats.totalUnits} units`}
                />
                <StatItem
                  variant="row"
                  label="Health Rating"
                  value={
                    <span className="text-teal-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      {Math.round((portfolioStats.goodHealthCount / (portfolioStats.totalBuildings || 1)) * 100)}% Good
                    </span>
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. RENTER STRATEGY CALLOUT BANNER
        ========================================================================= */}
        <section 
          id="renter-strategy-banner"
          className="bg-teal-50/60 border border-teal-200/60 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-white text-teal-700 border border-teal-100 rounded-xl shrink-0 hidden sm:flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-teal-800 block">
                NYC Renter Portfolio Strategy
              </span>
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                &ldquo;If this company does not have availability at one property, consider asking about vacancies across their wider portfolio.&rdquo;
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                Rent-stabilized apartments in New York City often turn over without public broker listings. Reaching out directly to the management leasing office and referencing their full stabilized portfolio below allows you to inquire about upcoming lease expirations across all their locations.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. CLEAN PORTFOLIO SUMMARY BY BOROUGH
        ========================================================================= */}
        <section id="portfolio-summary-section" className="space-y-3.5">
          <SectionHeader
            title="Portfolio Distribution"
            subtitle="Overview of rent-stabilized properties by New York City borough"
            action={
              selectedBorough !== 'All' ? (
                <button
                  onClick={() => setSelectedBorough('All')}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                >
                  Show all boroughs
                </button>
              ) : undefined
            }
          />

          {/* Clean Borough Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Bronx */}
            <button
              type="button"
              onClick={() => {
                setSelectedBorough(selectedBorough === 'Bronx' ? 'All' : 'Bronx');
                setSelectedNeighborhood('All');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedBorough === 'Bronx'
                  ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-400/30'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">Bronx</span>
                <span className="text-[10px] font-medium text-slate-400 font-mono">
                  {portfolioStats.byBorough['Bronx'] ? `${portfolioStats.byBorough['Bronx'].units} units` : '342 units'}
                </span>
              </div>
              <p className="text-xl font-semibold text-teal-700">
                {portfolioStats.byBorough['Bronx']?.count ?? 8}{' '}
                <span className="text-xs font-normal text-slate-500">buildings</span>
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Norwood, Fordham & more
              </span>
            </button>

            {/* Manhattan */}
            <button
              type="button"
              onClick={() => {
                setSelectedBorough(selectedBorough === 'Manhattan' ? 'All' : 'Manhattan');
                setSelectedNeighborhood('All');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedBorough === 'Manhattan'
                  ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-400/30'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">Manhattan</span>
                <span className="text-[10px] font-medium text-slate-400 font-mono">
                  {portfolioStats.byBorough['Manhattan'] ? `${portfolioStats.byBorough['Manhattan'].units} units` : '128 units'}
                </span>
              </div>
              <p className="text-xl font-semibold text-teal-700">
                {portfolioStats.byBorough['Manhattan']?.count ?? 3}{' '}
                <span className="text-xs font-normal text-slate-500">buildings</span>
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Inwood, UWS & more
              </span>
            </button>

            {/* Queens */}
            <button
              type="button"
              onClick={() => {
                setSelectedBorough(selectedBorough === 'Queens' ? 'All' : 'Queens');
                setSelectedNeighborhood('All');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedBorough === 'Queens'
                  ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-400/30'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">Queens</span>
                <span className="text-[10px] font-medium text-slate-400 font-mono">
                  {portfolioStats.byBorough['Queens'] ? `${portfolioStats.byBorough['Queens'].units} units` : '48 units'}
                </span>
              </div>
              <p className="text-xl font-semibold text-teal-700">
                {portfolioStats.byBorough['Queens']?.count ?? 1}{' '}
                <span className="text-xs font-normal text-slate-500">building</span>
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Astoria & Western Queens
              </span>
            </button>

            {/* Portfolio Health Summary Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">HPD Health Record</span>
                <span className="text-[10px] font-medium text-emerald-700">
                  0 Vacate Orders
                </span>
              </div>
              <p className="text-xl font-semibold text-slate-900">
                {portfolioStats.goodHealthCount}{' '}
                <span className="text-xs font-normal text-emerald-700">Good Condition</span>
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                {portfolioStats.needsAttentionCount > 0 ? `${portfolioStats.needsAttentionCount} under repair` : 'All properties compliant'}
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. FILTERING & CONTROLS BAR
        ========================================================================= */}
        <section id="portfolio-filters-section" className="space-y-3 pt-1">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search portfolio by street name, address, or ZIP..."
                  size="md"
                />
              </div>

              {/* Filter Selects */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Borough Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Borough:</span>
                  <select
                    value={selectedBorough}
                    onChange={(e) => {
                      setSelectedBorough(e.target.value);
                      setSelectedNeighborhood('All');
                    }}
                    className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="All">All Boroughs</option>
                    {availableBoroughs.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Neighborhood Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Neighborhood:</span>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer max-w-[130px] truncate"
                  >
                    <option value="All">All Neighborhoods</option>
                    {availableNeighborhoods.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Health Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Health:</span>
                  <select
                    value={selectedHealth}
                    onChange={(e) => setSelectedHealth(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="All">All Health</option>
                    <option value="Good">Good Condition</option>
                    <option value="Fair">Fair Condition</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="units-desc">Most Units</option>
                    <option value="violations-asc">Fewest Violations</option>
                    <option value="year-desc">Newest Built</option>
                    <option value="address-asc">Address A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Pill Row */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">Active:</span>
                {selectedBorough !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-medium">
                    Borough: {selectedBorough}
                    <button onClick={() => setSelectedBorough('All')} className="hover:text-teal-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedNeighborhood !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-medium">
                    Neighborhood: {selectedNeighborhood}
                    <button onClick={() => setSelectedNeighborhood('All')} className="hover:text-teal-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedHealth !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-medium">
                    Health: {selectedHealth}
                    <button onClick={() => setSelectedHealth('All')} className="hover:text-teal-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-medium">
                    &ldquo;{searchQuery}&rdquo;
                    <button onClick={() => setSearchQuery('')} className="hover:text-teal-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 underline ml-1 cursor-pointer"
                >
                  Reset all
                </button>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            5. ASSOCIATED BUILDINGS LIST (REUSABLE BUILDING CARDS)
        ========================================================================= */}
        <section id="managed-buildings-grid-section" className="space-y-4">
          <SectionHeader
            title="Managed Rent-Stabilized Buildings"
            badge={
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200/60">
                {filteredBuildings.length}
              </span>
            }
            subtitle={`Showing ${filteredBuildings.length} of ${managedBuildings.length} properties`}
          />

          {filteredBuildings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredBuildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  isSaved={savedBuildingIds.includes(building.id)}
                  onSelect={onSelectBuilding}
                  onToggleSave={onToggleSaveBuilding}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Building2 className="w-5 h-5" />}
              title="No buildings match your current filters"
              description="Try clearing your search query or selecting a different borough or health condition."
              actionLabel="Clear all filters"
              actionVariant="secondary"
              onAction={handleResetFilters}
            />
          )}
        </section>
      </div>

      {/* =========================================================================
          VACANCY INQUIRY MODAL (RENTER OUTREACH TOOL)
      ========================================================================= */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-medium text-teal-800 uppercase tracking-wider block">
                  Renter Portfolio Outreach
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  Inquire with {management.name}
                </h3>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Use this pre-formatted inquiry message to email the property management leasing department directly about upcoming rent-stabilized openings across their buildings.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                  Preferred Location
                </label>
                <select
                  value={inquiryBorough}
                  onChange={(e) => setInquiryBorough(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Any Borough">Any Borough / Full Portfolio</option>
                  <option value="Bronx (Norwood / Fordham)">Bronx (Norwood / Fordham)</option>
                  <option value="Manhattan (Inwood / Heights / UWS)">Manhattan (Inwood / UWS)</option>
                  <option value="Queens (Astoria)">Queens (Astoria)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                  Unit Size
                </label>
                <select
                  value={inquiryBedrooms}
                  onChange={(e) => setInquiryBedrooms(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Studio">Studio</option>
                  <option value="1 Bedroom">1 Bedroom</option>
                  <option value="2 Bedrooms">2 Bedrooms</option>
                  <option value="3 Bedrooms">3+ Bedrooms</option>
                </select>
              </div>
            </div>

            {/* Generated Email Message Preview */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-mono leading-relaxed space-y-2 select-all">
              <p className="font-semibold text-slate-900 font-sans">Subject: Rent-Stabilized Apartment Inquiry — {inquiryBedrooms} in {inquiryBorough}</p>
              <p>Dear {management.name} Leasing Team,</p>
              <p>
                I am reaching out to inquire about current or upcoming rent-stabilized vacancies across your residential portfolio in {inquiryBorough} for a {inquiryBedrooms}.
              </p>
              <p>
                I am a qualified prospective tenant with complete documentation ready. If units are currently occupied, please let me know if I may join your waiting list for future lease turn dates.
              </p>
              <p>Thank you for your time and assistance.</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                isPill
                onClick={() => {
                  const text = `Subject: Rent-Stabilized Apartment Inquiry — ${inquiryBedrooms} in ${inquiryBorough}\n\nDear ${management.name} Leasing Team,\n\nI am reaching out to inquire about current or upcoming rent-stabilized vacancies across your residential portfolio in ${inquiryBorough} for a ${inquiryBedrooms}.\n\nI am a qualified prospective tenant with complete documentation ready. If units are currently occupied, please let me know if I may join your waiting list for future lease turn dates.\n\nThank you for your time and assistance.`;
                  handleCopy(text, 'inquiry-text', 'inquiry message template');
                }}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy Template
              </Button>

              <a
                href={`mailto:${management.email}?subject=${encodeURIComponent(`Rent-Stabilized Apartment Inquiry — ${inquiryBedrooms}`)}&body=${encodeURIComponent(`Dear ${management.name} Leasing Team,\n\nI am reaching out to inquire about current or upcoming rent-stabilized vacancies across your residential portfolio in ${inquiryBorough} for a ${inquiryBedrooms}.\n\nI am a qualified prospective tenant with complete documentation ready.\n\nThank you!`)}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Open Email Client
              </a>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
