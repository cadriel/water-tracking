import { describe, expect, test } from 'vitest';
import {
  ImportError,
  buildExport,
  dedupeAgainst,
  exportFileName,
  parseImport,
} from '../readingsImportExport';
import { STORE_SCHEMA_VERSION } from '../../store/useWaterTrackingStore';
import type { Meter, Reading } from '../../types';

function makeMeter(overrides: Partial<Meter> = {}): Meter {
  return {
    id: 'meter-1',
    name: 'Main',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeReading(overrides: Partial<Reading> = {}): Reading {
  return {
    id: 'r-1',
    meterId: 'meter-1',
    reading: 1300,
    takenAt: '2026-05-01T08:00:00.000Z',
    createdAt: '2026-05-01T08:00:00.000Z',
    source: 'homeowner',
    ...overrides,
  };
}

describe('buildExport', () => {
  test('produces a JSON document with schema version, meter info, and readings', () => {
    const meter = makeMeter();
    const readings = [makeReading(), makeReading({ id: 'r-2', takenAt: '2026-05-02T08:00:00.000Z' })];

    const json = buildExport(meter, readings);
    const parsed = JSON.parse(json);

    expect(parsed.schemaVersion).toBe(STORE_SCHEMA_VERSION);
    expect(typeof parsed.exportedAt).toBe('string');
    expect(parsed.meter).toEqual({ id: 'meter-1', name: 'Main', createdAt: '2026-01-01T00:00:00.000Z' });
    expect(parsed.readings).toHaveLength(2);
  });
});

describe('parseImport', () => {
  test('round-trips an export back into the same readings', () => {
    const readings = [makeReading(), makeReading({ id: 'r-2', takenAt: '2026-05-02T08:00:00.000Z' })];
    const json = buildExport(makeMeter(), readings);

    const parsed = parseImport(json);

    expect(parsed.readings).toHaveLength(2);
    expect(parsed.readings[0].takenAt).toBe('2026-05-01T08:00:00.000Z');
    expect(parsed.readings[1].takenAt).toBe('2026-05-02T08:00:00.000Z');
    expect(parsed.meter.name).toBe('Main');
  });

  test('upgrades a v0 export (readings missing source) via the shared migrate step', () => {
    const json = JSON.stringify({
      schemaVersion: 0,
      exportedAt: '2025-01-01T00:00:00.000Z',
      meter: makeMeter(),
      readings: [
        { id: 'r-1', meterId: 'meter-1', reading: 1200, takenAt: '2025-12-01T08:00:00.000Z', createdAt: '2025-12-01T08:00:00.000Z' },
      ],
    });

    const parsed = parseImport(json);

    expect(parsed.schemaVersion).toBe(STORE_SCHEMA_VERSION);
    expect(parsed.readings[0].source).toBe('homeowner');
  });

  test('upgrades a v1 utility reading by backfilling isEstimated=false', () => {
    const json = JSON.stringify({
      schemaVersion: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      meter: makeMeter(),
      readings: [
        {
          id: 'r-1',
          meterId: 'meter-1',
          reading: 1200,
          takenAt: '2025-12-01T08:00:00.000Z',
          createdAt: '2025-12-01T08:00:00.000Z',
          source: 'utility',
        },
      ],
    });

    const parsed = parseImport(json);

    expect(parsed.readings[0].source).toBe('utility');
    expect(parsed.readings[0].isEstimated).toBe(false);
  });

  test('rejects malformed JSON', () => {
    expect(() => parseImport('{not json')).toThrow(ImportError);
  });

  test('rejects a top-level JSON array', () => {
    expect(() => parseImport('[]')).toThrow(/object at the top level/);
  });

  test('rejects a future schemaVersion', () => {
    const json = JSON.stringify({
      schemaVersion: STORE_SCHEMA_VERSION + 1,
      exportedAt: '2026-05-01T00:00:00.000Z',
      meter: makeMeter(),
      readings: [],
    });
    expect(() => parseImport(json)).toThrow(/newer than this app supports/);
  });

  test('rejects a missing readings array', () => {
    const json = JSON.stringify({
      schemaVersion: STORE_SCHEMA_VERSION,
      exportedAt: '2026-05-01T00:00:00.000Z',
      meter: makeMeter(),
    });
    expect(() => parseImport(json)).toThrow(/Missing readings array/);
  });

  test('rejects a reading with a non-numeric value', () => {
    const json = JSON.stringify({
      schemaVersion: STORE_SCHEMA_VERSION,
      exportedAt: '2026-05-01T00:00:00.000Z',
      meter: makeMeter(),
      readings: [{ takenAt: '2026-05-01T08:00:00.000Z', reading: 'oops', source: 'homeowner' }],
    });
    expect(() => parseImport(json)).toThrow(/not a number/);
  });

  test('rejects a reading with an unknown source', () => {
    const json = JSON.stringify({
      schemaVersion: STORE_SCHEMA_VERSION,
      exportedAt: '2026-05-01T00:00:00.000Z',
      meter: makeMeter(),
      readings: [{ takenAt: '2026-05-01T08:00:00.000Z', reading: 1300, source: 'martian' }],
    });
    expect(() => parseImport(json)).toThrow(/unknown source/);
  });
});

describe('dedupeAgainst', () => {
  test('skips imported readings whose takenAt already exists locally', () => {
    const existing = [makeReading({ takenAt: '2026-05-01T08:00:00.000Z' })];
    const imported = [
      makeReading({ id: 'r-dup', takenAt: '2026-05-01T08:00:00.000Z' }),
      makeReading({ id: 'r-new', takenAt: '2026-05-02T08:00:00.000Z' }),
    ];

    const { toAdd, skipped } = dedupeAgainst(existing, imported);

    expect(toAdd).toHaveLength(1);
    expect(toAdd[0].takenAt).toBe('2026-05-02T08:00:00.000Z');
    expect(skipped).toHaveLength(1);
    expect(skipped[0].id).toBe('r-dup');
  });

  test('also dedupes against other entries inside the imported batch', () => {
    const imported = [
      makeReading({ id: 'r-a', takenAt: '2026-05-01T08:00:00.000Z' }),
      makeReading({ id: 'r-b', takenAt: '2026-05-01T08:00:00.000Z' }),
    ];

    const { toAdd, skipped } = dedupeAgainst([], imported);

    expect(toAdd).toHaveLength(1);
    expect(skipped).toHaveLength(1);
  });
});

describe('exportFileName', () => {
  // Use local-time Date constructor so tests don't drift across timezones.
  const may22 = new Date(2026, 4, 22, 9, 0, 0);

  test('builds a slugified filename with the date', () => {
    expect(exportFileName('Main', may22)).toBe('water-readings-main-2026-05-22.json');
  });

  test('slugifies awkward meter names', () => {
    expect(exportFileName("Outside (Garage's)", may22)).toBe(
      'water-readings-outside-garage-s-2026-05-22.json',
    );
  });

  test('falls back to "meter" when the name has nothing slug-worthy', () => {
    expect(exportFileName('!!!', may22)).toBe('water-readings-meter-2026-05-22.json');
  });
});
