import {
  BOROUGHS,
  PROPERTY_MATCH_STATUSES,
  STABILI_HEALTH_STATES,
  STABILI_SCHEMA_VERSION,
  type StabiliDatasetMetadata,
  type StabiliIndexRecord,
  type StabiliRecord,
} from './schema';

export interface ValidationIssue {
  path: string;
  message: string;
}

type Check = (value: unknown, path: string, issues: ValidationIssue[]) => void;

const issue = (issues: ValidationIssue[], path: string, message: string) => {
  issues.push({ path, message });
};

const string: Check = (value, path, issues) => {
  if (typeof value !== 'string') issue(issues, path, 'must be a string');
};

const nonEmptyString: Check = (value, path, issues) => {
  if (typeof value !== 'string' || value.trim() === '') {
    issue(issues, path, 'must be a non-empty string');
  }
};

const finiteNumber: Check = (value, path, issues) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issue(issues, path, 'must be a finite number');
  }
};

const integer = (minimum?: number): Check => (value, path, issues) => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    issue(issues, path, 'must be an integer');
  } else if (minimum !== undefined && value < minimum) {
    issue(issues, path, `must be at least ${minimum}`);
  }
};

const nullable = (check: Check): Check => (value, path, issues) => {
  if (value !== null) check(value, path, issues);
};

const arrayOf = (check: Check): Check => (value, path, issues) => {
  if (!Array.isArray(value)) {
    issue(issues, path, 'must be an array');
    return;
  }
  value.forEach((item, index) => check(item, `${path}[${index}]`, issues));
};

const oneOf = (values: readonly string[]): Check => (value, path, issues) => {
  if (typeof value !== 'string' || !values.includes(value)) {
    issue(issues, path, `must be one of: ${values.join(', ')}`);
  }
};

const literal = (expected: string): Check => (value, path, issues) => {
  if (value !== expected) issue(issues, path, `must equal ${JSON.stringify(expected)}`);
};

const object = (shape: Record<string, Check>): Check => (value, path, issues) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    issue(issues, path, 'must be an object');
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, check] of Object.entries(shape)) {
    if (!(key in record)) {
      issue(issues, `${path}.${key}`, 'is required');
    } else {
      check(record[key], `${path}.${key}`, issues);
    }
  }
};

const recordOf = (check: Check): Check => (value, path, issues) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    issue(issues, path, 'must be an object');
    return;
  }
  for (const [key, item] of Object.entries(value)) check(item, `${path}.${key}`, issues);
};

const isoDate: Check = (value, path, issues) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    issue(issues, path, 'must be an ISO-8601 date or UTC date-time');
  }
};

const address = object({
  addressLine1: nullable(string),
  addressLine2: nullable(string),
  borough: nullable(oneOf(BOROUGHS)),
  zipCode: nullable(string),
});

const violationDetail = object({
  id: nonEmptyString,
  sourceAgency: nonEmptyString,
  class: nullable(string),
  status: nullable(string),
  description: nullable(string),
  location: nullable(string),
  issuedAt: nullable(isoDate),
  correctedAt: nullable(isoDate),
});

const complaintDetail = object({
  id: nonEmptyString,
  sourceAgency: nonEmptyString,
  category: nullable(string),
  status: nullable(string),
  description: nullable(string),
  receivedAt: nullable(isoDate),
  closedAt: nullable(isoDate),
});

const vacateOrderDetail = object({
  id: nonEmptyString,
  sourceAgency: nonEmptyString,
  status: nullable(string),
  description: nullable(string),
  issuedAt: nullable(isoDate),
  rescindedAt: nullable(isoDate),
});

const stabiliRecord = object({
  id: nonEmptyString,
  source: object({
    agency: nonEmptyString,
    datasetName: nonEmptyString,
    sourceYear: nullable(integer(0)),
    sourceFile: nullable(string),
    sourcePage: nullable(integer(1)),
    sourceRow: nullable(integer(1)),
    sourceRecordId: nullable(string),
    sourceUrl: nullable(string),
  }),
  primaryAddress: address,
  alternateAddresses: arrayOf(address),
  identifiers: object({
    block: nullable(string),
    lot: nullable(string),
    bbl: nullable(string),
    bin: nullable(string),
    hpdBuildingId: nullable(string),
  }),
  stabilizationStatus: nullable(string),
  classifications: arrayOf(string),
  propertyMatch: object({
    status: oneOf(PROPERTY_MATCH_STATUSES),
    method: nullable(string),
    confidence: nullable((value, path, issues) => {
      finiteNumber(value, path, issues);
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        issue(issues, path, 'must be between 0 and 1');
      }
    }),
    reviewNote: nullable(string),
  }),
  building: nullable(object({
    buildingClass: nullable(string),
    yearBuilt: nullable(integer(0)),
    stories: nullable(finiteNumber),
    residentialUnits: nullable(integer(0)),
    totalUnits: nullable(integer(0)),
    ownershipType: nullable(string),
  })),
  management: nullable(object({
    managingAgentName: nullable(string),
    managingAgentId: nullable(string),
    registeredOwnerName: nullable(string),
    businessAddress: nullable(address),
    phone: nullable(string),
    email: nullable(string),
    website: nullable(string),
  })),
  health: object({
    state: oneOf(STABILI_HEALTH_STATES),
    explanation: nullable(string),
    evaluatedAt: nullable(isoDate),
    algorithmVersion: nullable(string),
  }),
  violations: object({
    totalCount: nullable(integer(0)),
    openCount: nullable(integer(0)),
    hazardousCount: nullable(integer(0)),
    immediatelyHazardousCount: nullable(integer(0)),
    details: nullable(arrayOf(violationDetail)),
  }),
  complaints: object({
    totalCount: nullable(integer(0)),
    openCount: nullable(integer(0)),
    details: nullable(arrayOf(complaintDetail)),
  }),
  bedbugHistory: nullable(arrayOf(object({
    reportingPeriod: nonEmptyString,
    infestationCount: nullable(integer(0)),
    eradicationCount: nullable(integer(0)),
    reinfestationCount: nullable(integer(0)),
    filingStatus: nullable(string),
  }))),
  vacateOrders: object({
    totalCount: nullable(integer(0)),
    activeCount: nullable(integer(0)),
    details: nullable(arrayOf(vacateOrderDetail)),
  }),
  relatedStabiliRecordIds: arrayOf(nonEmptyString),
  coordinates: object({
    latitude: nullable((value, path, issues) => {
      finiteNumber(value, path, issues);
      if (typeof value === 'number' && (value < -90 || value > 90)) {
        issue(issues, path, 'must be between -90 and 90');
      }
    }),
    longitude: nullable((value, path, issues) => {
      finiteNumber(value, path, issues);
      if (typeof value === 'number' && (value < -180 || value > 180)) {
        issue(issues, path, 'must be between -180 and 180');
      }
    }),
  }),
  freshness: object({
    generatedAt: nullable(isoDate),
    dhcrSourceAsOf: nullable(isoDate),
    hpdRetrievedAt: nullable(isoDate),
    otherSourcesRetrievedAt: recordOf(nullable(isoDate)),
  }),
});

const datasetMetadata = object({
  schemaVersion: literal(STABILI_SCHEMA_VERSION),
  datasetVersion: nullable(string),
  stabilizationSourceYear: nullable(integer(0)),
  generatedAt: nullable(isoDate),
  hpdRetrievedAt: nullable(isoDate),
  healthAlgorithmVersion: nonEmptyString,
  recordCounts: object({
    total: integer(0),
    byBorough: object(Object.fromEntries(BOROUGHS.map((borough) => [borough, integer(0)]))),
  }),
  propertyMatchCounts: object(
    Object.fromEntries(PROPERTY_MATCH_STATUSES.map((status) => [status, integer(0)])),
  ),
  buildingFilesByBorough: object(
    Object.fromEntries(BOROUGHS.map((borough) => [borough, arrayOf(nonEmptyString)])),
  ),
  sources: arrayOf(object({
    id: nonEmptyString,
    name: nonEmptyString,
    description: nonEmptyString,
    sourceUrl: nullable(string),
    sourceDataAsOf: nullable(isoDate),
    retrievedAt: nullable(isoDate),
  })),
});

const indexRecord = object({
  id: nonEmptyString,
  address: nullable(string),
  borough: oneOf(BOROUGHS),
  zipCode: nullable(string),
  managementName: nullable(string),
  ownerName: nullable(string),
  latitude: nullable(finiteNumber),
  longitude: nullable(finiteNumber),
  healthState: oneOf(STABILI_HEALTH_STATES),
  openViolationCount: nullable(integer(0)),
  complaintsLast36Months: nullable(integer(0)),
  residentialUnits: nullable(integer(0)),
  yearBuilt: nullable(integer(0)),
  propertyMatchStatus: oneOf(PROPERTY_MATCH_STATUSES),
  detailFile: nonEmptyString,
});

export function validateStabiliRecord(value: unknown, path = '$'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  stabiliRecord(value, path, issues);
  return issues;
}

export function validateDatasetMetadata(value: unknown, path = '$'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  datasetMetadata(value, path, issues);
  return issues;
}

export function validateStabiliIndexRecord(value: unknown, path = '$'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  indexRecord(value, path, issues);
  return issues;
}

export function assertStabiliRecord(value: unknown): asserts value is StabiliRecord {
  const issues = validateStabiliRecord(value);
  if (issues.length > 0) throw new Error(formatValidationIssues(issues));
}

export function assertDatasetMetadata(value: unknown): asserts value is StabiliDatasetMetadata {
  const issues = validateDatasetMetadata(value);
  if (issues.length > 0) throw new Error(formatValidationIssues(issues));
}

export function assertStabiliIndexRecord(value: unknown): asserts value is StabiliIndexRecord {
  const issues = validateStabiliIndexRecord(value);
  if (issues.length > 0) throw new Error(formatValidationIssues(issues));
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  return issues.map(({ path, message }) => `${path}: ${message}`).join('\n');
}
