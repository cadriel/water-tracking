import { averageDailyUsageLitres, averageDailyUsageLitresInLastNDays } from './usage';
import type { Reading } from '../types';

function makeReading(
  takenAt: string,
  reading: number,
  meterId = 'm1',
  source: 'homeowner' | 'utility' = 'homeowner',
): Reading {
  return {
    id: `${takenAt}-${reading}`,
    meterId,
    reading,
    takenAt,
    createdAt: takenAt,
    source,
  };
}

describe('averageDailyUsageLitres', () => {
  test('returns null for an empty array', () => {
    expect(averageDailyUsageLitres([])).toBeNull();
  });

  test('returns null for a single reading', () => {
    expect(averageDailyUsageLitres([makeReading('2026-05-01T08:00:00.000Z', 100)])).toBeNull();
  });

  test('returns null for two readings on the same day (zero span)', () => {
    expect(
      averageDailyUsageLitres([
        makeReading('2026-05-01T08:00:00.000Z', 100),
        makeReading('2026-05-01T20:00:00.000Z', 100.5),
      ]),
    ).toBeNull();
  });

  test('returns the correct L/day for two readings exactly one day apart', () => {
    expect(
      averageDailyUsageLitres([
        makeReading('2026-05-01T08:00:00.000Z', 100),
        makeReading('2026-05-02T08:00:00.000Z', 100.5),
      ]),
    ).toBeCloseTo(500, 5);
  });

  test('uses earliest and latest only, not consecutive pairs', () => {
    expect(
      averageDailyUsageLitres([
        makeReading('2026-05-01T08:00:00.000Z', 100),
        makeReading('2026-05-02T08:00:00.000Z', 100.25),
        makeReading('2026-05-04T08:00:00.000Z', 100.3),
      ]),
    ).toBeCloseTo(100, 5);
  });

  test('handles input that is not pre-sorted', () => {
    expect(
      averageDailyUsageLitres([
        makeReading('2026-05-04T08:00:00.000Z', 100.3),
        makeReading('2026-05-02T08:00:00.000Z', 100.25),
        makeReading('2026-05-01T08:00:00.000Z', 100),
      ]),
    ).toBeCloseTo(100, 5);
  });

  test('returns a negative number when readings decreased', () => {
    expect(
      averageDailyUsageLitres([
        makeReading('2026-05-01T08:00:00.000Z', 100.5),
        makeReading('2026-05-02T08:00:00.000Z', 100.3),
      ]),
    ).toBeCloseTo(-200, 5);
  });
});

describe('averageDailyUsageLitresInLastNDays', () => {
  const asOf = new Date('2026-05-31T12:00:00.000Z');

  test('returns null when no readings fall in the window', () => {
    expect(
      averageDailyUsageLitresInLastNDays(
        [
          makeReading('2026-03-30T08:00:00.000Z', 100),
          makeReading('2026-04-01T08:00:00.000Z', 100.5),
        ],
        30,
        asOf,
      ),
    ).toBeNull();
  });

  test('returns null when only one reading falls in the window', () => {
    expect(
      averageDailyUsageLitresInLastNDays(
        [
          makeReading('2026-03-30T08:00:00.000Z', 100),
          makeReading('2026-05-20T08:00:00.000Z', 100.5),
        ],
        30,
        asOf,
      ),
    ).toBeNull();
  });

  test('returns L/day across the window using only in-window readings', () => {
    // Window is 2026-05-01T12:00 .. asOf.
    // The 2026-04-30 reading is OUT of window and must be ignored.
    // Earliest in-window = 2026-05-11 @ 100.5; latest = 2026-05-21 @ 100.7.
    // Delta = 0.2 m³ over 10 days = 20 L/day.
    expect(
      averageDailyUsageLitresInLastNDays(
        [
          makeReading('2026-04-30T08:00:00.000Z', 100),
          makeReading('2026-05-11T12:00:00.000Z', 100.5),
          makeReading('2026-05-21T12:00:00.000Z', 100.7),
        ],
        30,
        asOf,
      ),
    ).toBeCloseTo(20, 5);
  });

  test('a reading exactly at the window boundary counts as in-window', () => {
    expect(
      averageDailyUsageLitresInLastNDays(
        [
          makeReading('2026-05-01T12:00:00.000Z', 100),
          makeReading('2026-05-31T12:00:00.000Z', 100.3),
        ],
        30,
        asOf,
      ),
    ).toBeCloseTo(10, 5);
  });

  test('defaults asOf to "now" when not provided', () => {
    const now = Date.now();
    const a = new Date(now - 25 * 3_600_000).toISOString();
    const b = new Date(now - 60_000).toISOString();
    const result = averageDailyUsageLitresInLastNDays(
      [makeReading(a, 100), makeReading(b, 100.1)],
      30,
    );
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });
});
