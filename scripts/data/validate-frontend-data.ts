import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatValidationIssues,
  validateDatasetMetadata,
  validateStabiliRecord,
  validateStabiliIndexRecord,
  type ValidationIssue,
} from '../../src/data/validation';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const publicDataDirectory = path.join(repositoryRoot, 'public/data');
const buildingsDirectory = path.join(publicDataDirectory, 'buildings');

async function readJson(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${path.relative(repositoryRoot, filePath)}: ${String(error)}`);
  }
}

async function findJsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findJsonFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : [];
  }));
  return nested.flat().sort();
}

function withFile(filePath: string, issues: ValidationIssue[]): string[] {
  if (issues.length === 0) return [];
  const relativePath = path.relative(repositoryRoot, filePath);
  return formatValidationIssues(issues).split('\n').map((line) => `${relativePath} ${line}`);
}

const errors: string[] = [];

const metadataPath = path.join(publicDataDirectory, 'metadata.json');
errors.push(...withFile(metadataPath, validateDatasetMetadata(await readJson(metadataPath))));

const indexPath = path.join(publicDataDirectory, 'index.json');
const indexArtifact = await readJson(indexPath);
if (!Array.isArray(indexArtifact)) {
  errors.push('public/data/index.json $: must be an array');
}
const indexRecords = Array.isArray(indexArtifact) ? indexArtifact : [];
const indexIds = new Set<string>();
indexRecords.forEach((record, index) => {
  errors.push(...withFile(indexPath, validateStabiliIndexRecord(record, `$[${index}]`)));
  const id = (record as { id?: unknown }).id;
  if (typeof id === 'string') {
    if (indexIds.has(id)) errors.push(`public/data/index.json $[${index}].id: duplicate ID ${id}`);
    indexIds.add(id);
  }
});

const buildingFiles = await findJsonFiles(buildingsDirectory);
const detailedIds = new Set<string>();
const relatedById = new Map<string, string[]>();
for (const filePath of buildingFiles) {
  const artifact = await readJson(filePath);
  const records = Array.isArray(artifact) ? artifact : [artifact];
  records.forEach((record, index) => {
    const location = Array.isArray(artifact) ? `$[${index}]` : '$';
    errors.push(...withFile(filePath, validateStabiliRecord(record, location)));
    const candidate = record as { id?: unknown; relatedStabiliRecordIds?: unknown };
    if (typeof candidate.id === 'string') {
      if (detailedIds.has(candidate.id)) errors.push(`${path.relative(repositoryRoot, filePath)} ${location}.id: duplicate ID ${candidate.id}`);
      detailedIds.add(candidate.id);
      if (Array.isArray(candidate.relatedStabiliRecordIds)) {
        relatedById.set(candidate.id, candidate.relatedStabiliRecordIds.filter((id): id is string => typeof id === 'string'));
      }
    }
  });
}

for (const [id, relatedIds] of relatedById) {
  relatedIds.forEach((relatedId) => {
    if (!detailedIds.has(relatedId)) errors.push(`${id}.relatedStabiliRecordIds: missing related ID ${relatedId}`);
  });
}
if (indexIds.size !== detailedIds.size || [...indexIds].some((id) => !detailedIds.has(id))) {
  errors.push(`public/data/index.json: index/detail ID sets differ (${indexIds.size} index, ${detailedIds.size} detailed)`);
}

const forbiddenContent = /(?:\.example\b|unsplash(?:\.com)?|\b(?:\+?1[ .-])?\(?\d{3}\)?[ .-]+555[ .-]+\d{4}\b|\b555[ .-]+\d{4}\b)/i;
for (const filePath of [metadataPath, indexPath, ...buildingFiles]) {
  if (forbiddenContent.test(await readFile(filePath, 'utf8'))) {
    errors.push(`${path.relative(repositoryRoot, filePath)}: contains forbidden mock/sample content`);
  }
}

if (errors.length > 0) {
  console.error(`Frontend data validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated metadata, ${indexRecords.length} index records, and ${detailedIds.size} detailed records across ${buildingFiles.length} shard(s).`);
}
