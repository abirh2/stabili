import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatValidationIssues,
  validateDatasetMetadata,
  validateStabiliRecord,
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

const buildingFiles = await findJsonFiles(buildingsDirectory);
for (const filePath of buildingFiles) {
  const artifact = await readJson(filePath);
  const records = Array.isArray(artifact) ? artifact : [artifact];
  records.forEach((record, index) => {
    const location = Array.isArray(artifact) ? `$[${index}]` : '$';
    errors.push(...withFile(filePath, validateStabiliRecord(record, location)));
  });
}

if (errors.length > 0) {
  console.error(`Frontend data validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated metadata and ${buildingFiles.length} building data file(s).`);
}
