/** Versioned contract between the build-time data pipeline and static frontend. */

export const STABILI_SCHEMA_VERSION = '1.0.0' as const;

export const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten_island'] as const;
export type Borough = (typeof BOROUGHS)[number];

export const PROPERTY_MATCH_STATUSES = ['matched', 'ambiguous', 'unmatched'] as const;
export type PropertyMatchStatus = (typeof PROPERTY_MATCH_STATUSES)[number];

export const STABILI_HEALTH_STATES = [
  'low_concern',
  'some_concerns',
  'higher_concern',
  'insufficient_data',
] as const;
export type StabiliHealthState = (typeof STABILI_HEALTH_STATES)[number];

/** ISO-8601 date or date-time string. Runtime validation checks its syntax. */
export type ISODateString = string;

export interface StabiliAddress {
  addressLine1: string | null;
  addressLine2: string | null;
  borough: Borough | null;
  zipCode: string | null;
}

export interface StabiliSourceInfo {
  agency: string;
  datasetName: string;
  sourceYear: number | null;
  sourceFile: string | null;
  sourcePage: number | null;
  sourceRow: number | null;
  sourceRecordId: string | null;
  sourceUrl: string | null;
}

export interface PropertyIdentifiers {
  block: string | null;
  lot: string | null;
  bbl: string | null;
  bin: string | null;
  hpdBuildingId: string | null;
}

export interface PropertyMatch {
  status: PropertyMatchStatus;
  method: string | null;
  confidence: number | null;
  reviewNote: string | null;
}

export interface BuildingAttributes {
  buildingClass: string | null;
  yearBuilt: number | null;
  stories: number | null;
  residentialUnits: number | null;
  totalUnits: number | null;
  ownershipType: string | null;
}

export interface ManagementInformation {
  managingAgentName: string | null;
  managingAgentId: string | null;
  registeredOwnerName: string | null;
  businessAddress: StabiliAddress | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface StabiliHealthSummary {
  state: StabiliHealthState;
  explanation: string | null;
  evaluatedAt: ISODateString | null;
  algorithmVersion: string | null;
}

export interface ViolationDetail {
  id: string;
  sourceAgency: string;
  class: string | null;
  status: string | null;
  description: string | null;
  location: string | null;
  issuedAt: ISODateString | null;
  correctedAt: ISODateString | null;
}

export interface ViolationsData {
  totalCount: number | null;
  openCount: number | null;
  hazardousCount: number | null;
  immediatelyHazardousCount: number | null;
  details: ViolationDetail[] | null;
}

export interface ComplaintDetail {
  id: string;
  sourceAgency: string;
  category: string | null;
  status: string | null;
  description: string | null;
  receivedAt: ISODateString | null;
  closedAt: ISODateString | null;
}

export interface ComplaintsData {
  totalCount: number | null;
  openCount: number | null;
  details: ComplaintDetail[] | null;
}

export interface BedbugHistoryEntry {
  reportingPeriod: string;
  infestationCount: number | null;
  eradicationCount: number | null;
  reinfestationCount: number | null;
  filingStatus: string | null;
}

export interface VacateOrderDetail {
  id: string;
  sourceAgency: string;
  status: string | null;
  description: string | null;
  issuedAt: ISODateString | null;
  rescindedAt: ISODateString | null;
}

export interface VacateOrdersData {
  totalCount: number | null;
  activeCount: number | null;
  details: VacateOrderDetail[] | null;
}

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface RecordFreshness {
  generatedAt: ISODateString | null;
  dhcrSourceAsOf: ISODateString | null;
  hpdRetrievedAt: ISODateString | null;
  otherSourcesRetrievedAt: Record<string, ISODateString | null>;
}

/**
 * One record corresponds to exactly one row in a DHCR source PDF. Several
 * records may therefore point to the same matched NYC building.
 */
export interface StabiliRecord {
  id: string;
  source: StabiliSourceInfo;
  primaryAddress: StabiliAddress;
  alternateAddresses: StabiliAddress[];
  identifiers: PropertyIdentifiers;
  stabilizationStatus: string | null;
  classifications: string[];
  propertyMatch: PropertyMatch;
  building: BuildingAttributes | null;
  management: ManagementInformation | null;
  health: StabiliHealthSummary;
  violations: ViolationsData;
  complaints: ComplaintsData;
  bedbugHistory: BedbugHistoryEntry[] | null;
  vacateOrders: VacateOrdersData;
  relatedStabiliRecordIds: string[];
  coordinates: Coordinates;
  freshness: RecordFreshness;
}

export interface DatasetSourceMetadata {
  id: string;
  name: string;
  description: string;
  sourceUrl: string | null;
  sourceDataAsOf: ISODateString | null;
  retrievedAt: ISODateString | null;
}

export interface StabiliDatasetMetadata {
  schemaVersion: typeof STABILI_SCHEMA_VERSION;
  datasetVersion: string | null;
  stabilizationSourceYear: number | null;
  generatedAt: ISODateString | null;
  hpdRetrievedAt: ISODateString | null;
  healthAlgorithmVersion: string;
  recordCounts: {
    total: number;
    byBorough: Record<Borough, number>;
  };
  propertyMatchCounts: Record<PropertyMatchStatus, number>;
  buildingFilesByBorough: Record<Borough, string[]>;
  sources: DatasetSourceMetadata[];
}

/** Compact fields used for discovery; detailed event arrays live in borough shards. */
export interface StabiliIndexRecord {
  id: string;
  address: string | null;
  borough: Borough;
  zipCode: string | null;
  managementName: string | null;
  ownerName: string | null;
  latitude: number | null;
  longitude: number | null;
  healthState: StabiliHealthState;
  openViolationCount: number | null;
  complaintsLast36Months: number | null;
  residentialUnits: number | null;
  yearBuilt: number | null;
  propertyMatchStatus: PropertyMatchStatus;
  detailFile: string;
}
