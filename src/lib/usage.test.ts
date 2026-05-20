import {
  averageDailyUsageLitres,
  averageDailyUsageLitresInLastNDays,
  averageBetweenLastUtilityReadings,
} from './usage';
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

describe('averageBetweenLastUtilityReadings', () => {
  test('returns null when there are no utility readings', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100),
        makeReading('2026-05-10T08:00:00.000Z', 100.5),
      ]),
    ).toBeNull();
  });

  test('returns null when there is only one utility reading', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100),
        makeReading('2026-05-10T08:00:00.000Z', 100.5, 'm1', 'utility'),
      ]),
    ).toBeNull();
  });

  test('returns null when the two utility readings are on the same day', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-01T20:00:00.000Z', 100.05, 'm1', 'utility'),
      ]),
    ).toBeNull();
  });

  test('returns the correct L/day for two utility readings 5 days apart', () => {
    // 0.5 m³ over 5 days = 100 L/day
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-06T08:00:00.000Z', 100.5, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(100, 5);
  });

  test('uses only the two most recent utility readings', () => {
    // Three utility readings; only the last two should determine the value.
    // Last two: 2026-05-10 @ 101.0 and 2026-05-15 @ 101.25 → 0.25 m³ over 5 days = 50 L/day.
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-10T08:00:00.000Z', 101.0, 'm1', 'utility'),
        makeReading('2026-05-15T08:00:00.000Z', 101.25, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(50, 5);
  });

  test('ignores homeowner readings between utility readings', () => {
    // Two utility readings 10 days apart; homeowner readings in between are ignored.
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
        makeReading('2026-05-05T08:00:00.000Z', 100.4), // homeowner, ignored
        makeReading('2026-05-08T08:00:00.000Z', 100.7), // homeowner, ignored
        makeReading('2026-05-11T08:00:00.000Z', 101.0, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(100, 5); // 1.0 m³ over 10 days = 100 L/day
  });

  test('handles input that is not pre-sorted', () => {
    expect(
      averageBetweenLastUtilityReadings([
        makeReading('2026-05-06T08:00:00.000Z', 100.5, 'm1', 'utility'),
        makeReading('2026-05-01T08:00:00.000Z', 100, 'm1', 'utility'),
      ]),
    ).toBeCloseTo(100, 5);
  });
});
