import { STORE_SCHEMA_VERSION, migrateState } from '../store/useWaterTrackingStore';
import type { Meter, Reading, ReadingSource } from '../types';

export interface ExportedMeterInfo {
  id: string;
  name: string;
  createdAt: string;
}

export interface ReadingsExport {
  schemaVersion: number;
  exportedAt: string;
  meter: ExportedMeterInfo;
  readings: Reading[];
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

const VALID_SOURCES: ReadingSource[] = ['homeowner', 'utility'];

export function buildExport(meter: Meter, readings: Reading[]): string {
  const payload: ReadingsExport = {
    schemaVersion: STORE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    meter: { id: meter.id, name: meter.name, createdAt: meter.createdAt },
    readings,
  };
  return JSON.stringify(payload, null, 2);
}

export interface ParsedImport {
  schemaVersion: number;
  exportedAt: string;
  meter: ExportedMeterInfo;
  readings: Reading[];
}

export function parseImport(text: string): ParsedImport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('File is not valid JSON.');
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ImportError('Expected a JSON object at the top level.');
  }
  const obj = raw as Record<string, unknown>;

  const schemaVersion = obj.schemaVersion;
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 0) {
    throw new ImportError('Missing or invalid schemaVersion.');
  }
  if (schemaVersion > STORE_SCHEMA_VERSION) {
    throw new ImportError(
      `File schema version ${schemaVersion} is newer than this app supports (${STORE_SCHEMA_VERSION}).`,
    );
  }

  const meter = parseMeterInfo(obj.meter);
  const readings = parseReadingsArray(obj.readings);

  const migrated = migrateState({ readings }, schemaVersion).readings ?? [];

  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : '',
    meter,
    readings: migrated,
  };
}

function parseMeterInfo(value: unknown): ExportedMeterInfo {
  if (!value || typeof value !== 'object') {
    throw new ImportError('Missing source meter information.');
  }
  const m = value as Record<string, unknown>;
  if (typeof m.id !== 'string' || typeof m.name !== 'string' || typeof m.createdAt !== 'string') {
    throw new ImportError('Source meter is malformed.');
  }
  return { id: m.id, name: m.name, createdAt: m.createdAt };
}

function parseReadingsArray(value: unknown): Reading[] {
  if (!Array.isArray(value)) {
    throw new ImportError('Missing readings array.');
  }
  return value.map((entry, index) => parseReading(entry, index));
}

function parseReading(value: unknown, index: number): Reading {
  if (!value || typeof value !== 'object') {
    throw new ImportError(`Reading at index ${index} is not an object.`);
  }
  const r = value as Record<string, unknown>;

  if (typeof r.takenAt !== 'string' || Number.isNaN(Date.parse(r.takenAt))) {
    throw new ImportError(`Reading at index ${index}: takenAt is missing or invalid.`);
  }
  if (typeof r.reading !== 'number' || !Number.isFinite(r.reading)) {
    throw new ImportError(`Reading at index ${index}: reading value is missing or not a number.`);
  }
  // source may be absent in v0 exports; the migrate step backfills it. Until
  // then, leave whatever the file had and let parseReadingsArray hand it to
  // migrateState. We only validate that, if present, it's a known value.
  if (r.source !== undefined && !VALID_SOURCES.includes(r.source as ReadingSource)) {
    throw new ImportError(`Reading at index ${index}: unknown source "${String(r.source)}".`);
  }

  return {
    id: typeof r.id === 'string' ? r.id : '',
    meterId: typeof r.meterId === 'string' ? r.meterId : '',
    reading: r.reading,
    takenAt: r.takenAt,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.takenAt,
    source: (r.source as ReadingSource | undefined) ?? ('homeowner' as ReadingSource),
    ...(typeof r.isEstimated === 'boolean' ? { isEstimated: r.isEstimated } : {}),
  };
}

export interface DedupeResult {
  toAdd: Reading[];
  skipped: Reading[];
}

export function dedupeAgainst(existing: Reading[], imported: Reading[]): DedupeResult {
  const existingTakenAt = new Set(existing.map(r => r.takenAt));
  const toAdd: Reading[] = [];
  const skipped: Reading[] = [];
  for (const r of imported) {
    if (existingTakenAt.has(r.takenAt)) {
      skipped.push(r);
    } else {
      toAdd.push(r);
      existingTakenAt.add(r.takenAt); // protect against duplicates within the import itself
    }
  }
  return { toAdd, skipped };
}

export function exportFileName(meterName: string, now: Date = new Date()): string {
  const slug =
    meterName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'meter';
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `water-readings-${slug}-${yyyy}-${mm}-${dd}.json`;
}
