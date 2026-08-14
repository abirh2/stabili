/**
 * Compatibility types for the current mock frontend.
 *
 * These are intentionally separate from the generated-data schema. Do not use
 * them for ingestion output; they can be removed when the UI is migrated.
 */
export type Route =
  | 'explore'
  | 'building-details'
  | 'management-profile'
  | 'saved'
  | 'about';

export type BuildingHealth = 'Good' | 'Fair' | 'Needs Attention' | 'Not enough data';

export interface ViolationRecord {
  id: string;
  issue: string;
  severity: 'Class A' | 'Class B' | 'Class C';
  severityLabel: string;
  date: string;
  status: string;
  codeSection?: string;
  location?: string;
  sourceAgency?: 'NYC HPD' | 'NYC DOB' | 'NYC Open Data' | string;
}

export interface ComplaintRecord {
  id: string;
  issue: string;
  category: string;
  date: string;
  status: string;
  department?: string;
  sourceAgency?: 'NYC HPD' | 'NYC DOB' | 'NYC 311' | 'NYC Open Data' | string;
}

export interface BedbugRecord {
  reportingPeriod: string;
  infestationCount: number;
  eradicatedCount: number;
  reinfestationCount: number;
  filingStatus: string;
  disclosureNote: string;
}

export interface BuildingRecord {
  id: string;
  address: string;
  secondaryAddress?: string;
  alternateAddresses?: string[];
  isGardenComplex?: boolean;
  complexName?: string;
  complexType?: 'Garden complex' | 'Multi-building property' | 'Residential campus' | string;
  relatedBuildingsCount?: number;
  neighborhood: string;
  borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  units?: number | null;
  yearBuilt?: number | null;
  stories?: number | null;
  ownership?: string | null;
  isStabilized: boolean;
  health?: BuildingHealth | null;
  openViolationsCount?: number | null;
  classCViolationsCount?: number | null;
  complaints311Count?: number | null;
  vacateOrdersCount?: number | null;
  managingAgent?: string | null;
  managementId?: string | null;
  managementOffice?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  registeredOwner?: string | null;
  businessMailingAddress?: string | null;
  bin?: string | null;
  bbl?: string | null;
  block?: string | null;
  lot?: string | null;
  hpdBuildingId?: string | null;
  buildingClassification?: string | null;
  renterClassificationBadge?: string | null;
  regulatoryStatusLabels?: string[];
  sourceYear?: number | string;
  sourceLabel?: string;
  sourceAgency?: 'NYS HCR' | 'NYC HPD' | 'NYC DOB' | 'NYC Open Data' | string;
  publicRecordRetrievedDate?: string;
  lastUpdatedDate?: string;
  isAmbiguousMatch?: boolean;
  matchReviewNote?: string;
  imageUrl?: string;
  featuredTag?: string;
  description?: string;
  violations?: ViolationRecord[] | null;
  complaints?: ComplaintRecord[] | null;
  bedbugHistory?: BedbugRecord | null;
}

export interface ManagementCompany {
  id: string;
  name: string;
  address?: string | null;
  businessMailingAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  totalStabilizedBuildings?: number | null;
  totalResidentialUnits?: number | null;
  boroughBreakdown?: {
    bronx?: number;
    brooklyn?: number;
    manhattan?: number;
    queens?: number;
    statenIsland?: number;
  } | null;
  buildingsNeedingRepair?: number | null;
  sourceLabel?: string;
  publicRecordRetrievedDate?: string;
}
