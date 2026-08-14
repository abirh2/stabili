import React, { useState, useEffect } from 'react';
import { SAMPLE_BUILDINGS } from '../data/sampleData';
import { 
  Badge, 
  Button, 
  PageContainer, 
  StatItem, 
  SectionHeader, 
  BuildingHealthStatus, 
  ContactActions,
  SourceMetadataTag,
  DataFreshnessBadge,
  AmbiguousRecordBadge
} from '../components/common';
import { Route, ViolationRecord, ComplaintRecord, BedbugRecord } from '../types';
import { 
  ShieldCheck, 
  Mail, 
  Bookmark, 
  BookmarkCheck, 
  Phone, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  MapPin, 
  FileText, 
  Share2, 
  ExternalLink,
  Copy,
  Check,
  Search,
  HelpCircle,
  Building,
  Info,
  Calendar,
  Bug,
  Compass,
  FileCheck2,
  X,
  Layers,
  Sparkles,
  Landmark,
  Map
} from 'lucide-react';

interface BuildingDetailsPageProps {
  buildingId: string;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export const BuildingDetailsPage: React.FC<BuildingDetailsPageProps> = ({
  buildingId,
  onSelectManagement,
  onNavigate,
  isSaved,
  onToggleSave,
}) => {
  const building = SAMPLE_BUILDINGS.find((b) => b.id === buildingId) || SAMPLE_BUILDINGS[0];
  
  // State management
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'violations' | 'complaints'>('violations');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [rentalSitesModalOpen, setRentalSitesModalOpen] = useState(false);
  const [relatedBuildingsModalOpen, setRelatedBuildingsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Address and complex variables
  const isComplex = Boolean(building.complexType || building.isGardenComplex || building.complexName);
  const complexLabel = building.complexType || (building.isGardenComplex ? 'Garden complex' : 'Multi-building property');
  
  // Derived renter-relevant classification badge (e.g., "Garden complex", "Multiple dwelling")
  const renterClassificationBadge =
    building.renterClassificationBadge ||
    (building.buildingClassification?.toLowerCase().includes('garden')
      ? 'Garden complex'
      : building.buildingClassification?.toLowerCase().includes('multiple dwelling') || building.buildingClassification?.toLowerCase().includes('class a') || building.buildingClassification?.toLowerCase().includes('class b')
      ? 'Multiple dwelling'
      : building.buildingClassification?.toLowerCase().includes('rooming')
      ? 'Rooming house'
      : building.buildingClassification?.toLowerCase().includes('hotel')
      ? 'Hotel / Rooming house'
      : undefined);

  // Regulatory and status labels list
  const regulatoryStatusLabels = building.regulatoryStatusLabels || [
    building.buildingClassification || 'Multiple Dwelling Class A',
    'Pre-1974 Rent Stabilization'
  ];

  // Parcel & source metadata
  const derivedBlock = building.block || (building.bbl ? building.bbl.split('-')[1] : '—');
  const derivedLot = building.lot || (building.bbl ? building.bbl.split('-')[2] : '—');
  const sourceYear = building.sourceYear || 2024;
  const sourceLabel = building.sourceLabel || `NYS Homes and Community Renewal, ${sourceYear} Building Registration File`;

  // Derived recognized alternate addresses (excluding exact duplicate of primary)
  const alternateAddressesList = Array.from(
    new Set([
      ...(building.secondaryAddress ? [building.secondaryAddress] : []),
      ...(building.alternateAddresses || []),
    ])
  ).filter((addr) => addr.toLowerCase().trim() !== building.address.toLowerCase().trim());
  
  const hasMultipleAddresses = alternateAddressesList.length > 0;

  // Fallback defaults for rich fields if not present
  const violations: ViolationRecord[] = building.violations || [
    {
      id: 'v-1',
      issue: 'Repair peeling paint or plaster on ceiling in public corridor',
      severity: 'Class A',
      severityLabel: 'Non-Hazardous (90-day cure)',
      date: 'Jan 18, 2026',
      status: 'Open - Notice Issued',
      codeSection: 'NYC Admin Code § 27-2018',
      location: 'Ground Floor Entry Hall'
    },
    {
      id: 'v-2',
      issue: 'Provide operable self-closing device for apartment entrance door',
      severity: 'Class B',
      severityLabel: 'Hazardous (30-day cure)',
      date: 'Dec 04, 2025',
      status: 'Certification Filed by Owner',
      codeSection: 'NYC Admin Code § 27-2041',
      location: 'Apt 3C Entrance'
    },
    {
      id: 'v-3',
      issue: 'Post current approved Superintendent contact notice in lobby',
      severity: 'Class A',
      severityLabel: 'Non-Hazardous (90-day cure)',
      date: 'Oct 22, 2025',
      status: 'Open - Pending Re-inspection',
      codeSection: 'NYC Admin Code § 27-2053',
      location: 'Mailbox Lobby Area'
    }
  ];

  const complaints: ComplaintRecord[] = building.complaints || [
    {
      id: 'c-1',
      issue: 'Intermittent water temperature fluctuation during morning heating cycle',
      category: 'Heating & Hot Water',
      date: 'Feb 03, 2026',
      status: 'Resolved - HPD Inspector verified adequate temperature',
      department: 'NYC HPD'
    },
    {
      id: 'c-2',
      issue: 'Intercom buzzer inaudible from second floor unit',
      category: 'Building Access & Security',
      date: 'Jan 11, 2026',
      status: 'Closed - Super completed maintenance repair',
      department: 'NYC 311'
    },
    {
      id: 'c-3',
      issue: 'Scheduled elevator inspection inquiry notice',
      category: 'Elevator Maintenance',
      date: 'Nov 29, 2025',
      status: 'Closed - Annual DOB inspection passed',
      department: 'NYC DOB'
    }
  ];

  const bedbugRecord: BedbugRecord = building.bedbugHistory || {
    reportingPeriod: '2024–2025 HPD Annual Reporting Cycle',
    infestationCount: 0,
    eradicatedCount: 0,
    reinfestationCount: 0,
    filingStatus: 'Annual HPD Disclosure Filed (Clear Record)',
    disclosureNote: `Zero bedbug infestations reported across all ${building.units} residential units during the preceding 12-month filing period.`
  };

  const managementOffice = building.managementOffice || '123 Real Estate Blvd, Suite 400, New York, NY 10001';
  const managementEmail = building.email || 'contact@examplemgmt.nyc';
  const hpdId = building.hpdBuildingId || '84920';
  const classCCount = building.classCViolationsCount ?? 0;

  // Copy helper with feedback
  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setToastMessage(`Copied ${label} to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
      setToastMessage(null);
    }, 2500);
  };

  // External rental search URLs
  const encodedAddress = encodeURIComponent(building.address);
  const rentalSites = [
    {
      name: 'StreetEasy',
      desc: 'Search NYC rental listings & past leasing history',
      url: `https://streeteasy.com/for-rent/nyc/description:${encodedAddress}`,
      badge: 'Popular for NYC'
    },
    {
      name: 'RentHop',
      desc: 'View direct landlord and management postings',
      url: `https://www.renthop.com/search/nyc?q=${encodedAddress}`,
      badge: 'Direct Postings'
    },
    {
      name: 'Zillow',
      desc: 'Explore active vacancies and unit floor plans',
      url: `https://www.zillow.com/homes/for_rent/${encodedAddress}_rb/`,
      badge: 'Rentals'
    },
    {
      name: 'Apartments.com',
      desc: 'Check building overview and unit amenities',
      url: `https://www.apartments.com/new-york-ny/?search=${encodedAddress}`,
      badge: 'Directory'
    }
  ];

  return (
    <PageContainer
      maxWidth="1200"
      id="building-details-container"
      backAction={{
        label: 'Back to Explore',
        onBack: () => onNavigate('explore'),
      }}
      headerRight={
        <button
          onClick={() => handleCopy(window.location.href, 'share', 'page link')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedKey === 'share' ? 'Link Copied!' : 'Share'}</span>
        </button>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          HEADER & ACTIONS
      ========================================================================= */}
      <header className="mb-6 space-y-4 pt-1">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="max-w-3xl">
            {/* Status & Complex Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 rounded-full border border-emerald-200/70">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-xs font-medium text-emerald-800 tracking-tight">
                  Appears in NYC rent-stabilized building records
                </span>
              </div>

              {renterClassificationBadge && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full border border-slate-200/80">
                  <Building className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 tracking-tight">
                    {renterClassificationBadge}
                  </span>
                </div>
              )}

              {isComplex && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200/80">
                  <Layers className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 tracking-tight">
                    {complexLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Ambiguous Match Review Warning Badge if applicable */}
            {building.isAmbiguousMatch && (
              <div className="mb-3">
                <AmbiguousRecordBadge reviewNote={building.matchReviewNote} />
              </div>
            )}

            {/* Clear Primary Display Address */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              {building.address}
            </h1>

            {/* Location & Complex Context */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base text-slate-500 font-normal">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{building.neighborhood}, {building.borough}, NY {building.zipCode}</span>
              </p>

              {building.complexName && (
                <>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-xs text-slate-600 font-medium">
                    Part of {building.complexName}
                  </span>
                </>
              )}
            </div>

            {/* Subtle space for future action: View related buildings */}
            {isComplex && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRelatedBuildingsModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:text-teal-900 cursor-pointer underline underline-offset-2 decoration-teal-300 hover:decoration-teal-600 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-teal-700" />
                  <span>View related buildings in this complex</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Mail className="w-4 h-4" />}
              onClick={() => setContactModalOpen(true)}
            >
              Contact management
            </Button>

            <Button
              variant="secondary"
              size="md"
              leftIcon={
                isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-teal-700 fill-teal-700" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )
              }
              onClick={onToggleSave}
            >
              {isSaved ? 'Saved' : 'Save'}
            </Button>

            <Button
              variant="outline"
              size="md"
              leftIcon={<Search className="w-4 h-4" />}
              onClick={() => setRentalSitesModalOpen(true)}
            >
              Rental sites
            </Button>
          </div>
        </div>

        {/* Renter Notice / Explanatory Copy */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900 block">Rent Stabilization Record Notice</span>
            <p className="text-slate-600 text-[11px] sm:text-xs">
              This property is listed on official NYC DHCR records as containing rent-stabilized residential units. Specific apartment stabilization status depends on individual lease histories and tax program terms. Stabili provides property record research and does not track live rental vacancies.
            </p>
          </div>
        </div>
      </header>

      {/* Property Spec Hero Panel & Neutral Map Placeholder Slot */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
        {/* Main Property Identity & Specs Panel */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Verified Property Record
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                BIN: {building.bin} • BBL: {building.bbl}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {building.address}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                {building.neighborhood}, {building.borough} • {building.zipCode}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Units</span>
                <span className="text-base font-bold text-slate-900">{building.units} residential</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Year Built</span>
                <span className="text-base font-bold text-slate-900">{building.yearBuilt}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Stories</span>
                <span className="text-base font-bold text-slate-900">{building.stories} floors</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Managing Agent</span>
                <span className="text-xs font-bold text-slate-900 truncate block mt-0.5" title={building.managingAgent}>
                  {building.managingAgent}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-teal-700" />
              <span>Registered Owner: <strong className="text-slate-800 font-medium">{building.registeredOwner}</strong></span>
            </span>
            <span className="text-[11px] text-slate-400">Public Record • NYS DHCR / NYC HPD</span>
          </div>
        </div>

        {/* Right Bento Slot: Map Placeholder & Vacancy Link */}
        <div className="hidden md:flex flex-col gap-3.5">
          {/* Neutral Map Component Placeholder */}
          <div className="h-1/2 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 p-4 flex flex-col justify-between relative group">
            {/* Subtle Grid Background to explicitly look like a GIS vector component */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-60" />
            
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-2xs">
                Interactive Map Placeholder
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                NYC GIS Parcel
              </span>
            </div>

            <div className="relative z-10 text-center space-y-1.5 my-auto py-2">
              <div className="w-9 h-9 rounded-full bg-teal-800 text-white flex items-center justify-center mx-auto shadow-sm ring-4 ring-teal-50">
                <MapPin className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {building.address}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {building.borough} • Block {derivedBlock}, Lot {derivedLot}
              </p>
            </div>

            <div className="relative z-10 text-[10px] text-center text-slate-400 border-t border-slate-200/60 pt-1.5">
              Future GIS Map Layer Integration
            </div>
          </div>

          {/* Rental Search Shortcut Tile */}
          <div 
            onClick={() => setRentalSitesModalOpen(true)}
            className="h-1/2 rounded-2xl overflow-hidden border border-teal-200/70 bg-teal-50/50 p-5 flex flex-col justify-center items-center text-center hover:bg-teal-50/80 transition-colors cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-white text-teal-700 flex items-center justify-center border border-teal-100 mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-900 block">
              Check Vacancy Portals
            </span>
            <span className="text-[11px] text-teal-800 mt-0.5">StreetEasy, RentHop & more →</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TWO-COLUMN CONTENT GRID
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* -------------------------------------------------------------------
              1. BUILDING OVERVIEW
          ------------------------------------------------------------------- */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
            <SectionHeader
              title="Building Overview"
              subtitle="Property specifications and structural details"
              badge={<Badge variant="neutral" size="sm">NYC DOB Verified</Badge>}
            />

            {/* Compact Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              <StatItem
                label="Residential Units"
                value={building.units !== undefined && building.units !== null ? building.units : 'Unknown'}
                subtext={building.units !== undefined && building.units !== null ? "Apartments" : "Record unavailable"}
              />
              <StatItem
                label="Year Built"
                value={building.yearBuilt !== undefined && building.yearBuilt !== null ? building.yearBuilt : 'Unknown'}
                subtext={building.yearBuilt !== undefined && building.yearBuilt !== null ? "Pre-war era" : "Record unavailable"}
              />
              <StatItem
                label="Stories"
                value={building.stories !== undefined && building.stories !== null ? building.stories : 'Unknown'}
                subtext={building.stories !== undefined && building.stories !== null ? "Floors" : "Record unavailable"}
              />
              <StatItem
                label="Ownership"
                value={building.ownership || 'Unspecified'}
                subtext={building.ownership ? "Private Entity" : "Record unlisted"}
              />
            </div>

            {/* Property Addresses Section (when multiple recognized addresses exist) */}
            {hasMultipleAddresses && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                      Property Addresses
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {1 + alternateAddressesList.length} recognized street listings
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Primary Display Address */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shrink-0">
                        Primary Address
                      </span>
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {building.address}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(building.address, 'primary-addr', 'primary address')}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                      title="Copy primary address"
                    >
                      {copiedKey === 'primary-addr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Secondary / Associated Addresses (Visually subordinate) */}
                  {alternateAddressesList.map((altAddr, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 bg-white/70 rounded-lg border border-slate-200/70 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                          Also associated with
                        </span>
                        <span className="text-xs text-slate-700 truncate font-normal">
                          {altAddr}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(altAddr, `alt-${idx}`, 'alternate address')}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                        title="Copy associated address"
                      >
                        {copiedKey === `alt-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                  NYC properties on corner lots, multi-entrance tax parcels, or garden complexes often appear under alternate street numbers on lease agreements, DHCR filings, or utility records.
                </p>
              </div>
            )}

            {/* Garden Complex / Multi-Building Callout & Related Buildings Action Space */}
            {isComplex && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                    <Layers className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">
                        {building.complexName || 'Multi-Building Complex'}
                      </h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 border border-slate-300/60">
                        {complexLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {building.relatedBuildingsCount 
                        ? `Contains ${building.relatedBuildingsCount} interconnected buildings sharing common parcel management.`
                        : 'Part of a multi-building garden community or shared property group.'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Layers className="w-3.5 h-3.5" />}
                  onClick={() => setRelatedBuildingsModalOpen(true)}
                  className="shrink-0 text-xs bg-white hover:bg-slate-50"
                >
                  View related buildings
                </Button>
              </div>
            )}

            {/* Expandable "Official property record" Area */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/40">
              <button
                type="button"
                onClick={() => setIsRecordsOpen(!isRecordsOpen)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100/60">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 block">
                        Official property record
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/70 text-slate-700">
                        Government Registry Data
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      NYS HCR registration, building classification, tax lot IDs & regulatory labels
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-teal-800 shrink-0">
                  <span>{isRecordsOpen ? 'Hide' : 'Expand record'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isRecordsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {isRecordsOpen && (
                <div className="px-4 pb-5 pt-3 border-t border-slate-200/70 bg-white space-y-4">
                  {/* Government Source Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Landmark className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Official Government Registration Record</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal italic">
                      Source: {sourceLabel}
                    </div>
                  </div>

                  {/* Classification & Source Year Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Source Registration Year
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {sourceYear} Building Registration File
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">NYS HCR Annual Registry</span>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Building Classification
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {building.buildingClassification || 'Multiple Dwelling Class A'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">NYC Housing Designation</span>
                    </div>
                  </div>

                  {/* Regulatory & Status Labels */}
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Regulatory & Technical Status Labels
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {regulatoryStatusLabels.map((label, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-200/80 shadow-2xs"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Parcel & Identifier Grid: Block, Lot, BIN, BBL, HPD Building ID */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                        Block
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-900">
                        {derivedBlock}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                        Lot
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-900">
                        {derivedLot}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                        BIN
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {building.bin}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(building.bin, 'bin', 'BIN')}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy BIN"
                        >
                          {copiedKey === 'bin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                        BBL
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-slate-900 truncate">
                          {building.bbl}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(building.bbl, 'bbl', 'BBL')}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy BBL"
                        >
                          {copiedKey === 'bbl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                        HPD ID
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {hpdId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(hpdId, 'hpd', 'HPD ID')}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy HPD ID"
                        >
                          {copiedKey === 'hpd' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clear Data Provenance Banner */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>Data Separation: Official Government Records vs. Stabili Summaries</span>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      The attributes in this record are fetched directly from public state and city registration files ({sourceLabel}). They are strictly distinguished from Stabili-generated insights (such as Building Health ratings), preserving trust and objective transparency.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>


          {/* -------------------------------------------------------------------
              2. MANAGEMENT (CLEAN PROMINENT SECTION)
          ------------------------------------------------------------------- */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
            <SectionHeader
              title="Property Management"
              subtitle="Official NYC HPD Registered Operating Agent & Owner"
              badge={
                building.managingAgent ? (
                  <Badge variant="verified" size="sm">Verified Contact</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Partial Public Record</Badge>
                )
              }
              action={
                building.managementId ? (
                  <button
                    onClick={() => onSelectManagement(building.managementId!)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-900 cursor-pointer shrink-0"
                  >
                    <span>View profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
            />

            {/* Source & Freshness Metadata Tag */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <SourceMetadataTag 
                agency={building.sourceAgency || 'NYC HPD'} 
                retrievedDate={building.publicRecordRetrievedDate || 'Aug 2026'} 
              />
              <DataFreshnessBadge 
                lastUpdatedDate={building.publicRecordRetrievedDate || 'Aug 2026'} 
              />
            </div>

            {/* Management Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Managing Agent Box */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2.5">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Managing Agent
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">
                    {building.managingAgent || 'Managing agent unavailable in current record'}
                  </h3>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Management / Agent Address
                  </span>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                    {building.managementOffice || building.businessMailingAddress || 'No business address filed'}
                  </p>
                </div>
              </div>

              {/* Registered Owner Box */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2.5">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Registered Owner Entity
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">
                    {building.registeredOwner || 'Owner record unlisted in current filing'}
                  </h3>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    HPD Registration Status
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{building.registeredOwner || building.managingAgent ? 'Active Annual Registration on File' : 'Registration Pending Update'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Action Tiles */}
            <div className="mb-5">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Direct Contact Actions
              </span>
              <ContactActions
                phone={building.phone}
                email={building.email}
                website={building.website}
                address={building.managementOffice}
                businessMailingAddress={building.businessMailingAddress}
                variant="tiles"
                subject={`Inquiry regarding rent-stabilized lease at ${building.address}`}
                onToast={(msg) => setToastMessage(msg)}
                emptyStateText="Management contact information was not available in the current public record."
              />
            </div>

            {/* Portfolio callout if management ID exists */}
            {building.managementId && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-teal-50/60 border border-teal-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-950">
                      This management company operates other rent-stabilized buildings nearby.
                    </p>
                    <p className="text-[11px] text-teal-800">
                      View their full portfolio and housing records across NYC.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSelectManagement(building.managementId!)}
                  className="shrink-0 text-xs"
                >
                  Explore portfolio
                </Button>
              </div>
            )}
          </section>


          {/* -------------------------------------------------------------------
              4. VIOLATIONS AND COMPLAINTS (TABBED INTERFACE)
          ------------------------------------------------------------------- */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
            <SectionHeader
              title="Violations & Complaints Log"
              subtitle="Official NYC HPD and 311 municipal service records"
              action={
                <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('violations')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeTab === 'violations'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Violations ({building.openViolationsCount || violations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('complaints')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeTab === 'complaints'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    311 Complaints ({building.complaints311Count || complaints.length})
                  </button>
                </div>
              }
            />

            {/* Tab 1: Violations List */}
            {activeTab === 'violations' && (
              <div className="space-y-2.5">
                {violations.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                    <h4 className="text-xs font-semibold text-slate-900">Zero Open Violations</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                      This property has no unresolved code violations currently on file with the NYC HPD.
                    </p>
                  </div>
                ) : (
                  violations.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* Severity Badge */}
                          {item.severity === 'Class C' ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-800 text-[10px] font-medium rounded-full border border-red-200/80 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              Class C • Immediately Hazardous
                            </span>
                          ) : item.severity === 'Class B' ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-900 text-[10px] font-medium rounded-full border border-amber-200/80 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              Class B • Hazardous
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-200/70 text-slate-800 text-[10px] font-medium rounded-full border border-slate-300/70 flex items-center gap-1">
                              <Info className="w-3 h-3 text-slate-600" />
                              Class A • Non-Hazardous
                            </span>
                          )}

                          {item.location && (
                            <span className="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/70">
                              {item.location}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-slate-900 leading-snug">
                        {item.issue}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
                        <span className="text-slate-500">
                          Status: <strong className="text-slate-800 font-semibold">{item.status}</strong>
                        </span>
                        {item.codeSection && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            {item.codeSection}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Clarification footnote */}
                <div className="pt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>HPD violations are inspected under NYC Housing Maintenance Code standards.</span>
                </div>
              </div>
            )}

            {/* Tab 2: Complaints List */}
            {activeTab === 'complaints' && (
              <div className="space-y-2.5">
                {complaints.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                    <h4 className="text-xs font-semibold text-slate-900">Zero Active 311 Inquiries</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                      No recent residential 311 service requests recorded for this building this year.
                    </p>
                  </div>
                ) : (
                  complaints.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-medium rounded-full border border-teal-200/70">
                          {comp.category}
                        </span>

                        <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {comp.date}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-slate-900 leading-snug">
                        {comp.issue}
                      </p>

                      <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-500">
                        <span>
                          Resolution: <strong className="text-slate-800 font-semibold">{comp.status}</strong>
                        </span>
                        <span className="text-slate-400 font-normal">{comp.department}</span>
                      </div>
                    </div>
                  ))
                )}

                <div className="pt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>311 service requests reflect tenant notifications submitted to city agencies.</span>
                </div>
              </div>
            )}
          </section>
        </div>


        {/* =========================================================================
            RIGHT SIDEBAR (1 COL)
        ========================================================================= */}
        <div className="space-y-5">

          {/* -------------------------------------------------------------------
              3. BUILDING HEALTH CARD
          ------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <SectionHeader
              title="Building Health"
              eyebrow="Condition Rating"
              badge={<Badge variant="neutral" size="sm">Stabili Summary</Badge>}
              size="sm"
            />

            {/* Overall Status Presentation */}
            <BuildingHealthStatus
              health={building.health}
              variant="card"
              showDescription
            />

            {/* Compact Metrics Grid */}
            <div className="space-y-2.5 text-xs">
              <StatItem
                variant="row"
                label="Open Violations (HPD)"
                value={building.openViolationsCount}
                valueClassName={building.openViolationsCount > 5 ? 'text-amber-800' : 'text-slate-900'}
              />

              <StatItem
                variant="row"
                label="Class C Violations"
                value={`${classCCount} ${classCCount === 0 ? '• Clear' : ''}`}
                valueClassName={classCCount > 0 ? 'text-red-700' : 'text-emerald-800'}
              />

              <StatItem
                variant="row"
                label="Complaints this year"
                value={`${building.complaints311Count} YTD`}
              />

              <StatItem
                variant="row"
                label="Active Vacate Orders"
                value={`${building.vacateOrdersCount} active`}
                valueClassName="text-emerald-800"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-normal">
              Class C violations represent immediately hazardous conditions (such as heat outages). Zero Class C violations indicates prompt maintenance.
            </div>
          </div>


          {/* -------------------------------------------------------------------
              5. BEDBUG HISTORY
          ------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3.5">
            <SectionHeader
              title="Bedbug History"
              eyebrow="Annual City Filing"
              size="sm"
              icon={<Bug className="w-4 h-4" />}
            />

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950">
                <span className="font-semibold block">{bedbugRecord.filingStatus}</span>
                <span className="text-emerald-800 text-[11px] leading-relaxed mt-0.5 block">
                  {bedbugRecord.disclosureNote}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
              <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10px] font-medium text-slate-400 block uppercase">Infested</span>
                <span className="text-sm font-bold text-slate-900">{bedbugRecord.infestationCount}</span>
              </div>
              <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10px] font-medium text-slate-400 block uppercase">Treated</span>
                <span className="text-sm font-bold text-slate-900">{bedbugRecord.eradicatedCount}</span>
              </div>
              <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10px] font-medium text-slate-400 block uppercase">Re-infested</span>
                <span className="text-sm font-bold text-slate-900">{bedbugRecord.reinfestationCount}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              NYC Local Law 69 requires residential landlords to file annual reports with HPD and provide past 12-month bedbug history to new incoming tenants upon lease signing.
            </p>
          </div>


          {/* -------------------------------------------------------------------
              KNOW YOUR RIGHTS QUICK GUIDE
          ------------------------------------------------------------------- */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5 text-teal-400">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Renter Protection</span>
            </div>
            <h4 className="text-sm font-semibold text-white">
              What does Rent Stabilization guarantee?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Rent-stabilized tenants in NYC are legally entitled to:
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside font-normal">
              <li>Automatic 1 or 2-year lease renewals</li>
              <li>Rent increases capped by Rent Guidelines Board</li>
              <li>Protection from arbitrary evictions</li>
            </ul>
            <button
              onClick={() => onNavigate('about')}
              className="text-xs font-medium text-teal-300 hover:text-teal-200 hover:underline pt-1.5 block cursor-pointer"
            >
              Read guide to NYC stabilization rights →
            </button>
          </div>

        </div>
      </div>


      {/* =========================================================================
          6. AVAILABILITY CTA (CALM BOTTOM CALLOUT)
      ========================================================================= */}
      <section className="mt-10 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-500/15 text-teal-300 rounded-full text-xs font-medium border border-teal-400/20">
            <Compass className="w-3 h-3" />
            <span>Apartment Inquiries</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Looking for an apartment here?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Stabili doesn't track vacancies. Contact the registered management company directly to ask about current or upcoming rent-stabilized apartments.
          </p>

          {/* Action Buttons Row */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Mail className="w-4 h-4" />}
              onClick={() => setContactModalOpen(true)}
            >
              Contact management
            </Button>

            <Button
              variant="secondary"
              size="md"
              leftIcon={<Search className="w-4 h-4" />}
              onClick={() => setRentalSitesModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Check rental sites
            </Button>
          </div>

          {/* Optional tertiary prompt */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectManagement(building.managementId || 'example-mgmt')}
              className="text-xs font-medium text-teal-300 hover:text-teal-200 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ask about other buildings they manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STICKY BOTTOM BAR FOR MOBILE & QUICK ACCESS (SCROLL ACTIVATED)
      ========================================================================= */}
      <div 
        className={`fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200/80 py-2.5 px-4 sm:px-6 z-40 transition-all duration-300 ${
          showStickyBar 
            ? 'translate-y-0 opacity-100 pointer-events-auto shadow-lg' 
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          {/* Desktop Summary Info */}
          <div className="hidden sm:block">
            <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {building.address} • <span className="text-slate-500 font-normal">{building.managingAgent}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              NYC Rent-Stabilized Record • {building.units} units • Built {building.yearBuilt}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Save Button */}
            <button
              type="button"
              onClick={onToggleSave}
              className={`h-9 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-medium text-xs transition-all cursor-pointer select-none shrink-0 ${
                isSaved
                  ? 'bg-teal-50 text-teal-800 border-teal-200/80'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save building'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-teal-700 fill-teal-700" />
              ) : (
                <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden xs:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Check Rental Sites Button */}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              onClick={() => setRentalSitesModalOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              <span className="hidden xs:inline">Rental </span>Sites
            </Button>

            {/* Primary Contact Management Button */}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              onClick={() => setContactModalOpen(true)}
              className="flex-1 sm:flex-initial"
            >
              Contact <span className="hidden xs:inline">management</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: CONTACT MANAGEMENT DIALOG
      ========================================================================= */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 max-w-lg w-full shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] font-medium text-teal-800 uppercase tracking-wider block mb-0.5">
                  Direct Inquiries
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Contact {building.managingAgent}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regarding {building.address} ({building.neighborhood})
                </p>
              </div>
              <button
                onClick={() => setContactModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Direct Info Box */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-normal">Direct Phone:</span>
                  <a
                    href={`tel:${building.phone}`}
                    className="font-medium text-teal-800 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{building.phone || '(555) 123-4567'}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-normal">Email Address:</span>
                  <a
                    href={`mailto:${managementEmail}`}
                    className="font-medium text-teal-800 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>{managementEmail}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-normal">Office Location:</span>
                  <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                    {managementOffice}
                  </span>
                </div>
              </div>

              {/* Inquiry Message Generator */}
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Ready-to-Send Renter Inquiry Script
                </label>
                <textarea
                  id="inquiry-script-textarea"
                  rows={4}
                  defaultValue={`Hello,\n\nI am contacting your office regarding upcoming residential lease availability at ${building.address} in ${building.neighborhood}. According to NYC public records, this building contains rent-stabilized units. Could you please let me know if there are any current or upcoming apartments available for rent, and what your application requirements are?\n\nThank you,\nProspective Renter`}
                  className="w-full p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 leading-relaxed font-normal"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    const el = document.getElementById('inquiry-script-textarea') as HTMLTextAreaElement;
                    if (el) handleCopy(el.value, 'template', 'inquiry email script');
                  }}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  {copiedKey === 'template' ? 'Copied Script' : 'Copy Script'}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    const el = document.getElementById('inquiry-script-textarea') as HTMLTextAreaElement;
                    const body = el ? encodeURIComponent(el.value) : '';
                    window.location.href = `mailto:${managementEmail}?subject=Apartment Availability Inquiry - ${encodeURIComponent(building.address)}&body=${body}`;
                    setContactModalOpen(false);
                  }}
                  leftIcon={<Mail className="w-3.5 h-3.5" />}
                >
                  Open Mail App
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CHECK RENTAL SITES DIALOG
      ========================================================================= */}
      {rentalSitesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 max-w-lg w-full shadow-xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-medium text-teal-800 uppercase tracking-wider block mb-0.5">
                  Vacancy Search
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Check Rental Listings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search live availability for {building.address} across NYC portals
                </p>
              </div>
              <button
                onClick={() => setRentalSitesModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 my-3.5">
              {rentalSites.map((site) => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-teal-800 transition-colors">
                        {site.name}
                      </span>
                      <span className="text-[10px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100/80">
                        {site.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">{site.desc}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 transition-transform shrink-0" />
                </a>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-normal border border-slate-100 mb-3.5">
              💡 <strong>Pro Renter Tip:</strong> When viewing listings on external sites, look for the description note stating <em>"Rent Stabilized Lease"</em> or compare asking rents against standard rent stabilization guidelines.
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setRentalSitesModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RELATED BUILDINGS IN COMPLEX DIALOG
      ========================================================================= */}
      {relatedBuildingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 max-w-lg w-full shadow-xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium mb-1 border border-slate-200/80">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>{complexLabel}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {building.complexName || 'Related Complex Properties'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Property grouping for {building.address} ({building.neighborhood})
                </p>
              </div>
              <button
                onClick={() => setRelatedBuildingsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Current Building</span>
                  <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70">
                    Active View
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{building.address}</p>
                <p className="text-[11px] text-slate-500">
                  {building.units} units • {building.stories} stories • Built {building.yearBuilt} • {building.neighborhood}
                </p>
              </div>

              <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-100 text-teal-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-teal-950 block">Multi-Building Complex Records</span>
                  <p className="text-teal-900/90 text-[11px] leading-relaxed">
                    NYC garden complexes, courtyard developments, and campus properties contain multiple interconnected buildings sharing central boilers, managing agents, and common tax lots. In an upcoming update, you will be able to browse all sibling buildings in this complex with single-click filtering.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRelatedBuildingsModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
