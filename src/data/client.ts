import type { StabiliDatasetMetadata, StabiliIndexRecord, StabiliRecord } from './schema';

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

let indexPromise: Promise<StabiliIndexRecord[]> | undefined;
let metadataPromise: Promise<StabiliDatasetMetadata> | undefined;
const shardPromises = new Map<string, Promise<StabiliRecord[]>>();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(assetUrl(path));
  if (!response.ok) {
    throw new Error(`Unable to load ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function loadBuildingIndex(): Promise<StabiliIndexRecord[]> {
  indexPromise ??= fetchJson<StabiliIndexRecord[]>('data/index.json').catch((error) => {
    indexPromise = undefined;
    throw error;
  });
  return indexPromise;
}

export function loadDatasetMetadata(): Promise<StabiliDatasetMetadata> {
  metadataPromise ??= fetchJson<StabiliDatasetMetadata>('data/metadata.json').catch((error) => {
    metadataPromise = undefined;
    throw error;
  });
  return metadataPromise;
}

export function loadBuildingShard(detailFile: string): Promise<StabiliRecord[]> {
  let request = shardPromises.get(detailFile);
  if (!request) {
    request = fetchJson<StabiliRecord[]>(`data/${detailFile}`).catch((error) => {
      shardPromises.delete(detailFile);
      throw error;
    });
    shardPromises.set(detailFile, request);
  }
  return request;
}

export async function loadBuilding(id: string): Promise<StabiliRecord | null> {
  const index = await loadBuildingIndex();
  const summary = index.find((record) => record.id === id);
  if (!summary) return null;
  const records = await loadBuildingShard(summary.detailFile);
  return records.find((record) => record.id === id) ?? null;
}

export async function loadIndexRecords(ids: readonly string[]): Promise<StabiliIndexRecord[]> {
  if (ids.length === 0) return [];
  const wanted = new Set(ids);
  return (await loadBuildingIndex()).filter((record) => wanted.has(record.id));
}

export function managementKey(name: string): string {
  return name.trim();
}

export function managementNameFromKey(key: string): string | null {
  try {
    const name = decodeURIComponent(key).trim();
    return name || null;
  } catch {
    return null;
  }
}
