import type { BuildingRecord, BuildingHealth } from '../types/legacy';
import type { Borough, StabiliAddress, StabiliIndexRecord, StabiliRecord } from './schema';
import { managementKey } from './client';

const boroughLabels: Record<Borough, BuildingRecord['borough']> = {
  bronx: 'Bronx',
  brooklyn: 'Brooklyn',
  manhattan: 'Manhattan',
  queens: 'Queens',
  staten_island: 'Staten Island',
};

const healthLabels: Record<StabiliIndexRecord['healthState'], BuildingHealth> = {
  low_concern: 'Good',
  some_concerns: 'Fair',
  higher_concern: 'Needs Attention',
  insufficient_data: 'Not enough data',
};

export const displayBorough = (borough: Borough | null) => borough ? boroughLabels[borough] : 'NYC';

export function formatAddress(address: StabiliAddress | null): string | null {
  if (!address) return null;
  return [address.addressLine1, address.addressLine2, address.zipCode].filter(Boolean).join(', ') || null;
}

export function indexToBuilding(record: StabiliIndexRecord): BuildingRecord {
  return {
    id: record.id,
    address: record.address ?? 'Address unavailable',
    neighborhood: displayBorough(record.borough),
    borough: boroughLabels[record.borough],
    zipCode: record.zipCode ?? 'Unavailable',
    latitude: record.latitude,
    longitude: record.longitude,
    units: record.residentialUnits,
    yearBuilt: record.yearBuilt,
    isStabilized: true,
    health: healthLabels[record.healthState],
    openViolationsCount: record.openViolationCount,
    complaints311Count: record.complaintsLast36Months,
    managingAgent: record.managementName,
    managementId: record.managementName ? managementKey(record.managementName) : null,
    registeredOwner: record.ownerName,
    isAmbiguousMatch: record.propertyMatchStatus === 'ambiguous',
    sourceAgency: 'NYS HCR',
    sourceLabel: 'DHCR Building Registration File',
  };
}

export function detailToBuilding(record: StabiliRecord): BuildingRecord {
  const management = record.management;
  return {
    ...indexToBuilding({
      id: record.id,
      address: record.primaryAddress.addressLine1,
      borough: record.primaryAddress.borough ?? 'manhattan',
      zipCode: record.primaryAddress.zipCode,
      managementName: management?.managingAgentName ?? null,
      ownerName: management?.registeredOwnerName ?? null,
      latitude: record.coordinates.latitude,
      longitude: record.coordinates.longitude,
      healthState: record.health.state,
      openViolationCount: record.violations.openCount,
      complaintsLast36Months: record.complaints.totalCount,
      residentialUnits: record.building?.residentialUnits ?? null,
      yearBuilt: record.building?.yearBuilt ?? null,
      propertyMatchStatus: record.propertyMatch.status,
      detailFile: '',
    }),
    alternateAddresses: record.alternateAddresses.map((address) => formatAddress(address)).filter((value): value is string => Boolean(value)),
    stories: record.building?.stories ?? null,
    ownership: record.building?.ownershipType ?? null,
    classCViolationsCount: record.violations.immediatelyHazardousCount,
    vacateOrdersCount: record.vacateOrders.activeCount,
    phone: management?.phone ?? null,
    email: management?.email ?? null,
    website: management?.website ?? null,
    businessMailingAddress: formatAddress(management?.businessAddress ?? null),
    bin: record.identifiers.bin,
    bbl: record.identifiers.bbl,
    block: record.identifiers.block,
    lot: record.identifiers.lot,
    hpdBuildingId: record.identifiers.hpdBuildingId,
    buildingClassification: record.building?.buildingClass ?? null,
    regulatoryStatusLabels: record.classifications,
    sourceYear: record.source.sourceYear ?? undefined,
    sourceLabel: record.source.datasetName,
    sourceAgency: record.source.agency,
    publicRecordRetrievedDate: record.freshness.hpdRetrievedAt ?? undefined,
    lastUpdatedDate: record.freshness.generatedAt ?? undefined,
    matchReviewNote: record.propertyMatch.reviewNote ?? undefined,
  };
}
